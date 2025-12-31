import asyncio
import config
from logger import logger
from evdev import InputDevice, list_devices, categorize, ecodes
from .events import *

class ScannerHandler:
    """Handles discovery, control, and input processing for a barcode scanner device."""

    def __init__(self, event_callback):
        # Scanner initialization
        self.scanner = None
        self.scanner_enabled = False

        # Tasks responsible for producing barcodes and consuming them
        self.producer_task = None
        self.consumer_task = None
        
        # Queue holding barcode strings awaiting processing
        self.barcode_queue = asyncio.Queue()

        # Callback used to forward events from this handler to the controller
        self.event_callback = event_callback

        #
        self.restart_attempted = False

        # Maps evdev keycodes to (unshifted, shifted) character representation
        self.keycodes = {
            **{f'KEY_{i}': (str(i), ')!@#$%^&*('[i]) for i in range(10)},                         # Numbers: ('0', ')'), ('1', '!'), ..., ('9', '(')
            **{f'KEY_{chr(i)}': (chr(i), chr(i).upper()) for i in range(ord('a'), ord('z') + 1)}, # Letters: ('a', 'A'), ('b', 'B'), ..., ('z', 'Z')
            
            # Punctuation
            'KEY_SPACE': (' ', ' '),
            'KEY_MINUS': ('-', '_'),
            'KEY_EQUAL': ('=', '+'),
            'KEY_LEFTBRACE': ('[', '{'),
            'KEY_RIGHTBRACE': (']', '}'), 
            'KEY_SEMICOLON': (';', ':'),
            'KEY_APOSTROPHE': ("'", '"'),
            'KEY_GRAVE': ('`', '~'),
            'KEY_BACKSLASH': ('\\', '|'),
            'KEY_COMMA': (',', '<'), 
            'KEY_DOT': ('.', '>'),
            'KEY_SLASH': ('/', '?')
        }

    async def start_handler(self):
        """Starts handler operation."""
        self.scanner = self.__find_and_grab_scanner()
        
        if self.scanner is None:
            # Most probably caused because the barcode scanner USB connection is unstable
            logger.error("Unable to start scanner handler.")
            await self.event_callback(ScannerFailureEvent())
            return

        self.producer_task = asyncio.create_task(self.__produce_loop())
        self.consumer_task = asyncio.create_task(self.__consume_loop())
        logger.info("Scanner handler started successfully.")
            
    
    async def stop_handler(self):
        """Stops handler in case of scanner failure."""
        await self.__stop_handler_tasks()
        
        # Clear any remaining barcodes in queue
        while not self.barcode_queue.empty():
            self.barcode_queue.get_nowait()
        
        if self.scanner:
            # Release exclusive access to the device
            try:
                self.scanner.ungrab()
            except Exception as e:
                logger.warning("Failed to release exclusive access to the device.")
                logger.detail(e)
                
            # Close file descriptor to the driver
            try:
                self.scanner.close()
            except Exception as e:
                logger.warning("Failed to close scanner file descriptor.")
                logger.detail(e)

            self.scanner = None

        self.scanner_enabled = False
        logger.info("Scanner handler stopped.")
        
    
    def enable_scan(self):
        """Enable barcode processing."""
        self.scanner_enabled = True
        logger.info("Barcode processing enabled.")

    
    def disable_scan(self):
        """Disable barcode processing."""
        self.scanner_enabled = False
        logger.info("Barcode processing disabled.")
    

    async def __stop_handler_tasks(self):
        """Stops the producer and consumer tasks."""
        await self.__stop_task(self.producer_task)
        await self.__stop_task(self.consumer_task)


    async def __stop_task(self, task: asyncio.Task):
        """Stops a given task."""
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass


    async def __produce_loop(self):
        """Read evdev key events from scanner and produce barcode strings."""
        barcode = ""         # Buffer for characters of the current barcode
        is_shifted = False   # Tracks SHIFT modifier state
        barcode_valid = True # Allows barcode submission when valid

        try:
            async for input_event in self.scanner.async_read_loop():
                if not self.scanner_enabled or input_event.type != ecodes.EV_KEY:
                    continue

                # Convert the InputEvent (raw numeric codes) into KeyEvent
                key_event = categorize(input_event)

                # Handle shift modifier key assertion / de-assertion
                if key_event.keycode == 'KEY_RIGHTSHIFT':
                    is_shifted = (key_event.keystate == key_event.key_down)
                    continue
                        
                # Ignore key_up events, to prevent duplicates
                if key_event.keystate != key_event.key_down:
                    continue

                # Barcode submission key assertion
                if key_event.keycode == 'KEY_ENTER':
                    if barcode and barcode_valid:
                        self.barcode_queue.put_nowait(barcode)
                    elif not barcode_valid:
                        await self.event_callback(InvalidBarcodeEvent())
                    barcode = "" # Empty buffer
                    barcode_valid = True # Assume the next scanned barcode is valid

                # Character-producing key assertion
                else:
                    char = self.__map_keycode(key_event.keycode, is_shifted)
                    if char:
                        barcode += char
                    else:
                        barcode_valid = False # Character not found, barcode is not valid
            
        except asyncio.CancelledError:
            logger.info("Scanner handler 'Producer Task' stopped.")
        
        except Exception as e:
            # Most probably caused because barcode scanner USB connection is unstable
            logger.error(f"Unexpected error while producing barcode. 'Producer Task' crashed.")
            logger.detail(e)
            await self.event_callback(ScannerFailureEvent())
    
    
    def __map_keycode(self, keycode: str, is_shifted: bool) -> str | None:
        """Translate an HID keycode to its character representation based on the current SHIFT modifier state."""
        try:
            unshifted, shifted = self.keycodes[keycode]
            return shifted if is_shifted else unshifted
        except KeyError:
            logger.warning(f"Keycode '{keycode}' could not be mapped.")
            return None
    
    
    async def __consume_loop(self):
        """Consume barcodes from queue and emit the relevant event."""
        try:
            while True:
                barcode = await self.barcode_queue.get()
                await self.event_callback(BarcodeScannedEvent(barcode))
        except asyncio.CancelledError:
            logger.info("Scanner handler 'Consumer Task' stopped.")
    

    def __find_and_grab_scanner(self) -> InputDevice | None:
        """Locate the barcode scanner using its vendor and product IDs and acquire exclusive access to it."""
        try:
            device_paths = list_devices()
            if not device_paths:
                logger.error("No input devices found on the OS.")
                return None
        except Exception as e:
            logger.error(f"Failed to list input devices.")
            logger.detail(e)
            return None

        # Iterate over files representing available input devices
        for path in device_paths:
            scanner = self.__inspect_device(path, config.SCANNER_VID, config.SCANNER_PID)
            if scanner:
                acquired = self.__acquire_scanner(scanner)
                if not acquired:
                    scanner.close()
                    return None
                return scanner
        
        # Reached after inspecting all input devices without finding the barcode scanner
        logger.error(f"Barcode scanner with VID = 0x{config.SCANNER_VID:04x} and PID = 0x{config.SCANNER_PID:04x} was not found.")
        return None


    def __inspect_device(self, path: str, vendor_id: int, product_id: int):
        """Inspect a device's identity and return it if it matches the barcode scanner."""
        try:
            device = InputDevice(path) # Opens a file descriptor to the device driver
            
            if device.info.vendor != vendor_id or device.info.product != product_id: # Skip device if vendor / product IDs do not match
                device.close()
                return None
            
            logger.info(f"Barcode scanner device found at '{path}'.")
            return device
        
        except Exception as e:
            logger.error(f"Could not access device in path '{path}'.")
            logger.detail(e)
            return None
            
    
    def __acquire_scanner(self, scanner: InputDevice) -> bool:
        """Acquire an exclusive access to the barcode scanner. Returns True if successfully acquired."""
        try:
            scanner.grab()
            logger.info("Exclusive access to barcode scanner acquired successfully.")
            return True
        
        except Exception as e:
            logger.error("Failed to acquire an exclusive access to barcode scanner.")
            logger.detail(e)
            return False