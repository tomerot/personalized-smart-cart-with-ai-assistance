import asyncio
from client.client_handler import ClientHandler
from vapi.vapi_handler import VapiHandler
from client.commands import *
from logger import logger

class VoiceAssistantController:
    """Main controller that orchestrates communication between client handler and VAPI handler."""
    
    def __init__(self):
        self.client_handler = ClientHandler(self.__on_command)
        self.vapi_handler = VapiHandler(self.__on_event)
    
    async def start(self):
        """Starts the controller."""
        logger.info("Voice Assistant Controller starting...")
        await self.client_handler.start_serve() # Start listening for client commands
    
    async def __on_command(self, command):
        """
        Handle commands received from the client.
        Routes commands to appropriate actions.
        """
        if isinstance(command, EndSessionCommand): 
            if self.vapi_handler.call_active:
                # When session ended unexpectedly, while call was active
                await self.vapi_handler.end_call(notify_vapi = True)
            return

        command_actions = {
            StartCallCommand: lambda cmd: self.vapi_handler.start_call(cmd.variables),
            StopCallCommand:  lambda cmd: self.vapi_handler.end_call(notify_vapi = True)
        }

        action = command_actions.get(type(command))
        if action:
            await action(command)

    
    async def __on_event(self, event):
        """
        Handle events received from VAPI handler.
        Forwards events to the client.
        """
        if self.client_handler.session_active:
            await self.client_handler.send_queue.put(event.to_dict())


async def main():
    """Entry point."""
    controller = VoiceAssistantController()
    try:
        await controller.start()
    except KeyboardInterrupt:
        logger.info("Shutting down Voice Assistant Controller...")


if __name__ == "__main__":
    asyncio.run(main())