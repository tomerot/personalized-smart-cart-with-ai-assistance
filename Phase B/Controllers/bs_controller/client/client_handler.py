import asyncio
import websockets
import json
import config
from .client_message_handler import ClientMessageHandler
from .commands import *
from logger import logger

class ClientHandler:
    """Handles the communication lifecycle with the client."""
    
    def __init__(self, command_callback):
        # Background async tasks responsible for streaming messages over the client WebSocket
        self.sender_task = None
        self.receiver_task = None

        # Messages queue to send to the client, enqueued by the controller
        self.send_queue = asyncio.Queue()

        # Handles commands sent from client
        self.client_message_handler = ClientMessageHandler()
        
        # Active WebSocket connection to the client
        self.client_websocket = None
        self.session_active = False

        # Callback used to forward commands from this handler to the controller
        self.command_callback = command_callback

        # True if the WebSocket is closed intentionally
        self.intentional_disconnect = False


    async def start_serve(self):
        """Starts serving the client through WebSocket connection."""
        logger.info("Starting WebSocket server.")
        
        # Start listening on the configured host and port
        async with websockets.serve(
            self.__handle_client_connection,
            config.LOCAL_WS_HOST,
            config.LOCAL_WS_PORT
        ):
            logger.info(f"Server is listening on port {config.LOCAL_WS_PORT}.")
            await asyncio.Future() # Keep serving client indefinitely

    
    async def __handle_client_connection(self, websocket):
        """
        Handle a WebSocket connection with the client.
        Starts sender and receiver tasks.
        """
        logger.start_session()
        self.session_active = True
        self.intentional_disconnect = False # Reset flag
        
        self.client_websocket = websocket
        logger.info(f"Client connected from port {websocket.remote_address[1]}.")
        
        # Start sender and receiver tasks
        self.sender_task = asyncio.create_task(self.__sender_loop())
        self.receiver_task = asyncio.create_task(self.__receiver_loop())
        
        # Wait until either the receiver finishes or sender fails
        _, running = await asyncio.wait(
            [self.sender_task, self.receiver_task],
            return_when = asyncio.FIRST_COMPLETED
        )

        # Cancel the task that is still running - usually the sender
        for task in running:
            task.cancel()
            try:
                await task # Wait for cancellation to complete
            except asyncio.CancelledError:
                pass
        
        # When session ends
        await self.__stop_session()

    async def __sender_loop(self):
        """Send messages from the queue to the client."""
        try:
            while True:
                message = await self.send_queue.get()
                message_json = json.dumps(message)
                await self.client_websocket.send(message_json)
        except websockets.exceptions.ConnectionClosed:
            logger.error("Client WebSocket stopped. Client handler 'Sender Task' failed to send message to client.")
            logger.info("Client handler 'Sender Task' stopped.")
        except asyncio.CancelledError:
            pass
        finally:
            logger.info("Client handler 'Sender Task' stopped.")
            

    async def __receiver_loop(self):
        """Receive messages from the client and process them."""
        try:
            async for message in self.client_websocket:
                command = self.client_message_handler.handle(message)
                if command:
                    await self.__process_command(command)
        except websockets.exceptions.ConnectionClosed:
            # On crash
            if not self.intentional_disconnect:
                logger.error("Client WebSocket stopped unexpectedly.")
        finally:
            # Runs both when WebSocket closed intentionaly and when WebSocket crashed
            logger.info("Client handler 'Receiver Task' stopped.")
    

    async def __process_command(self, command):
        """Processes various commands before transmission."""
        if isinstance(command, EndSessionCommand):
            # This command implies the client intentionally terminated the session
            self.intentional_disconnect = True
            logger.info("Shopping session stopped. Client disconnected.")
            return
        
        # The controller handles any other received command
        await self.command_callback(command)

    
    async def __stop_session(self):
        """Stop session with client."""
        if not self.intentional_disconnect:
            # Unexpected session termination, notify the controller
            await self.command_callback(EndSessionCommand())
        
        # Flush any unsent messages from the queue
        while not self.send_queue.empty():
            try:
                self.send_queue.get_nowait()
                self.send_queue.task_done()
            except asyncio.QueueEmpty:
                break
        
        if self.client_websocket:
            await self.client_websocket.close()
        
        self.client_websocket = None
        self.session_active = False
        logger.stop_session()