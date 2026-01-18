import asyncio
from logger import logger
from client.client_handler import ClientHandler
from scanner.scanner_handler import ScannerHandler
from client.commands import *
from scanner.events import *

class BarcodeScannerController:
    """Main controller that orchestrates communication between client handler and scanner handler."""
    
    def __init__(self):
        self.client_handler = ClientHandler(self.__on_command)
        self.scanner_handler = ScannerHandler(self.__on_event)
    

    async def start(self):
        """Starts the controller."""
        logger.info("Barcode Scanner Controller starting...")
        await self.scanner_handler.start_handler()
        await self.client_handler.start_serve() # Start listening for client commands
    

    async def __on_command(self, command):
        """
        Handle commands received from the client.
        Routes commands to appropriate actions.
        """
        if isinstance(command, EndSessionCommand): 
            if self.scanner_handler.scanner_enabled:
                # When session ended unexpectedly, while scanner was enabled
                await self.scanner_handler.disable_scan()
            return

        command_actions = {
            EnableScannerCommand:  lambda cmd: self.scanner_handler.enable_scan(),
            DisableScannerCommand: lambda cmd: self.scanner_handler.disable_scan()
        }

        action = command_actions.get(type(command))
        if action:
            action(command)


    async def __on_event(self, event):
        """
        Handle events received from scanner handler.
        Forwards events to the client.
        """
        if isinstance(event, ScannerFailureEvent):
            self.scanner_handler.stop_handler()

        if self.client_handler.session_active:
            await self.client_handler.send_queue.put(event.to_dict())
                

async def main():
    """Entry point."""
    controller = BarcodeScannerController()
    try:
        await controller.start()
    except KeyboardInterrupt:
        logger.info("Shutting down Barcode Scanner Controller...")


if __name__ == "__main__":
    asyncio.run(main())