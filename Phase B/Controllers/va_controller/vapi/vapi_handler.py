import asyncio
import requests
import websockets
import json
import config
from .events import *
from .audio_handler import AudioHandler
from .control_message_handler import ControlMessageHandler
from logger import logger

class VapiHandler:
    """Handles VAPI call lifecycle."""

    def __init__(self, event_callback):
        # Background async tasks responsible for sending and receiving messages during a call
        self.sender_task = None
        self.receiver_task = None

        # A call consists of audio messages and control messages - need to handle both
        self.control_message_handler = ControlMessageHandler()
        self.audio_handler = None
        
        # WebSocket connection to VAPI servers - established per call
        self.call_websocket = None
        
        # Callback used to forward events from this handler to the controller
        self.event_callback = event_callback
        
        # Indicates whether a call session is currently active
        self.call_active = False

        # Tracks how long the user remains silent after the assistant stops speaking
        self.silence_timer = None


    async def start_call(self, variables: dict):
        """
        Start a new VAPI call with provided variables.
        """

        if self.call_active:
            logger.error("[ERROR] Call already active.")
            return
        
        if self.__env_var_missing():
            await self.event_callback(StartCallEvent(started = False)) # Cannot start
            return
        
        # Get WebSocket URL from VAPI API
        url = self.__fetch_websocket_url(variables)
        if not url:
            await self.event_callback(StartCallEvent(started = False))
            return
        
        self.__init_audio_handler()
        
        try:
            self.call_websocket = await websockets.connect(url)
            logger.info("WebSocket connection with VAPI established.")
            self.__init_call_tasks()
            self.call_active = True
            logger.info("Call started successfully.")
            await self.event_callback(StartCallEvent(started = True))
            self.__start_silence_timer(5)
            
        except Exception as e:
            logger.error(f"Failed to start call.")
            error_type = type(e).__name__
            message = str(e).strip() or "No additional details available."
            logger.detail(f"{error_type}: {message}.")
            await self.event_callback(StartCallEvent(started = False))
        

    async def end_call(self, notify_vapi: bool):
        """End the current call and clean up the resources."""
        if not self.call_active:
            logger.error("No active call to end.")
            return
        
        # Stop the silence timer to prevent it from ending an already terminated call
        if self.silence_timer:
            self.__stop_silence_timer()
        
        # Signal VAPI that call needs to end
        if notify_vapi:
            await self.__send_end_call_signal()
        
        await self.__end_call_tasks()
        self.__close_websocket() 
        await self.audio_handler.stop_audio_streams()
        self.audio_handler = None
        self.call_active = False
        

    async def __send_end_call_signal(self):
        """Send a request to the VAPI server to end the call, if requested by the client."""
        if self.call_websocket:
            try:
                await self.call_websocket.send(json.dumps({"type": "end-call"}))
                logger.info("Request to end the call was sent to VAPI servers.")
                await self.event_callback(EndCallEvent(expected = True))
            except Exception:
                logger.error(f"Failed to send a request to end the call to VAPI servers.")
    

    def __close_websocket(self):
        """Close the WebSocket connection to the VAPI server."""
        if self.call_websocket:
            asyncio.create_task(self.call_websocket.close())
            logger.info("WebSocket connection with VAPI closed.")


    async def __end_call_tasks(self):
        """Stop sender and receiver tasks."""
        if self.sender_task and not self.sender_task.done():
            self.sender_task.cancel()
            try:
                await self.sender_task # Wait for task to finish
            except asyncio.CancelledError:
                pass
        
        if self.receiver_task and not self.receiver_task.done():
            self.receiver_task.cancel()
            try:
                await self.receiver_task # Wait for task to finish
            except asyncio.CancelledError:
                pass


    def __init_call_tasks(self):
        """Start sender and receiver tasks."""
        self.sender_task = asyncio.create_task(self.__sender_loop())
        self.receiver_task = asyncio.create_task(self.__receiver_loop())
    

    async def __sender_loop(self):
        """Send microphone audio chunks to VAPI servers."""
        try:
            while True:
                audio_chunk = await self.audio_handler.mic_queue.get()
                await self.call_websocket.send(audio_chunk)
                self.audio_handler.mic_queue.task_done() # Acknowledge processing current audio chunk
        except asyncio.CancelledError: # Task cancelled
            logger.info("VAPI handler 'Sender Task' stopped.")
    

    async def __receiver_loop(self):
        """Receive messages from VAPI servers."""
        try:
            async for message in self.call_websocket:
                if isinstance(message, bytes): # VAPI audio
                    await self.audio_handler.speaker_queue.put(message)
                elif isinstance(message, str): # Control message
                    event = self.control_message_handler.route(message)
                    if event:
                        await self.__process_event(event)    
        except asyncio.CancelledError:
            logger.info("VAPI handler 'Receiver Task' stopped.")
        except websockets.exceptions.ConnectionClosed as e:
            if e.code != 1000: # WebSocket closed unexpecetedly
                logger.error(f"VAPI WebSocket connection closed unexpectedly with code {e.code}.")
                if e.reason:
                    logger.detail(f"{e.reason}")
                await self.event_callback(EndCallEvent(expected = False)) # Notify controller on unexpected termination
                await self.end_call(notify_vapi = False) # Connection is already closed, VAPI cannot be notified


    async def __process_event(self, event):
        """Processes various events before transmission."""
        if isinstance(event, EndCallEvent): # Indicates an unexpected termination from the VAPI side
            await self.end_call(notify_vapi = False) # Local cleanup only

        elif isinstance(event, AssistantSpeechUpdateEvent):
            if event.speaking: # In case the assistant is currently speaking
                self.audio_handler.mute_microphone() 
            else:
                logger.info("Waiting for playback to finish.")
                await self.audio_handler.speaker_queue.join() # Wait for speaker queue to drain before unmuting
                self.audio_handler.unmute_microphone()
                self.__start_silence_timer(5)
        
        elif isinstance(event, UserTranscriptEvent): 
            if self.silence_timer: # In case user activity is detected
                self.__stop_silence_timer()
                logger.info("User voice activity detected. Stopped silence timer.")
            if not event.is_final: # No need to send partial transcripts
                return

        await self.event_callback(event)


    def __start_silence_timer(self, duration):
        self.silence_timer = asyncio.create_task(self.__timeout(duration))
    

    def __stop_silence_timer(self):
        """Called when user starts speaking or call ends."""
        self.silence_timer.cancel()
        self.silence_timer = None


    async def __timeout(self, duration):
        """End call if user doesn't speak within given duration."""
        try:
            await asyncio.sleep(duration)
            logger.info("Silence timeout reached.")
            await self.end_call(notify_vapi = True) # Silence timeout reached, notify VAPI to end the call due to inactivity
        except asyncio.CancelledError:
            pass
        finally:
            self.silence_timer = None


    def __init_audio_handler(self):
        """Create and start all audio components."""
        self.audio_handler = AudioHandler()
        self.audio_handler.start_microphone()
        self.audio_handler.start_speaker()
        self.audio_handler.start_player_task()
        

    def __fetch_websocket_url(self, variables: dict) -> str | None:
        """Request WebSocket URL from VAPI API."""
        logger.info("Requesting WebSocket URL from VAPI...")
        
        # HTTP Headers defining the authentication credentials and specifying that the request body is JSON
        headers = {
            "Authorization": f"Bearer {config.VAPI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Structured JSON payload specifying the assistant configuration,
        # transport settings, runtime variables, and session metadata
        payload = {
            "assistantId": config.VAPI_ASSISTANT_ID,
            "assistantOverrides": {
                "variableValues": variables,
                "clientMessages": config.VAPI_CLIENT_MESSAGES
            },
            "transport": config.VAPI_TRANSPORT_CONFIG,
            "metadata": config.VAPI_METADATA
        }
        
        try:
            response = requests.post(config.VAPI_CALL_URL, headers = headers, json = payload)
            response.raise_for_status()
            
            response_json = response.json()
            transport = response_json.get("transport")
            
            if not transport:
                logger.error("Key 'transport' missing in VAPI response.")
                logger.detail("Response keys:", list(response_json.keys()))
                return None
            
            websocket_url = transport.get("websocketCallUrl")
            
            if not websocket_url:
                logger.error("Key 'websocketCallUrl' missing in 'transport' object.")
                logger.detail("Transport keys:", list(transport.keys()))
                return None
            
            logger.info("WebSocket URL retrieved successfully.")
            return websocket_url
            
        except requests.exceptions.RequestException as e:
            self.__log_vapi_call_error(e)
            return None
        

    def __env_var_missing(self) -> bool:
        """Checks if any required VAPI environment variables are missing from the configuration."""
        required = ["VAPI_API_KEY", "VAPI_ASSISTANT_ID"]

        for var in required:
            if not getattr(config, var, None):
                logger.error(f"'{var}' environment variable not set.")
                return True # At least one required variable is not set
                
        return False # All required variables are set


    def __log_vapi_call_error(self, e: requests.exceptions.RequestException):
        """Log errors when attempting to call the VAPI API."""
        if e.response is not None:
            self.__log_api_error(e.response)
        else:
            self.__log_network_error(e)


    def __log_api_error(self, response):
        """Handle Protocol Errors (4xx/5xx responses)."""
        status_code = response.status_code
        logger.error(f"HTTP error code {status_code} returned.")

        try:
            data = response.json()
            message = data.get('message')
            if message:
                logger.detail(f"VAPI server responded: {message}.")
        except ValueError:
            logger.detail("VAPI infrastructure issue.")  # Response is not a valid JSON


    def __log_network_error(self, e: Exception):
        """Handle Network-level failures."""
        logger.error("No HTTP response returned.")
        
        network_errors = {
            requests.exceptions.ConnectTimeout:  "Could not establish connection within allowed timeout",
            requests.exceptions.ReadTimeout:     "Server took too long to respond",
            requests.exceptions.Timeout:         "Request timed out during an unspecified stage",
            requests.exceptions.SSLError:        "SSL/TLS handshake failed",
            requests.exceptions.ConnectionError: "Network connection failed",
        }
        
        err_detail = network_errors.get(type(e))
        if err_detail:
            logger.detail(f"{err_detail}.")