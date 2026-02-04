import asyncio
import platform
from utils.audio.audio_player import AudioPlayer
from utils.volume.volume_handler import VolumeHandler
from client.client_handler import ClientHandler
from vapi.vapi_handler import VapiHandler
from client.commands import *
from logger import logger

class VoiceAssistantController:
    """
    Main controller that orchestrates communication between client handler, VAPI handler,
    and system audio components.
    """
    
    def __init__(self):
        self.client_handler = ClientHandler(self.__on_command)
        self.vapi_handler = VapiHandler(self.__on_event)
        self.audio_player = AudioPlayer()
        self.volume_handler = None
        
        # Volume handler is only available on the production environment (Linux)
        if platform.system() == "Linux":
            self.volume_handler = VolumeHandler()
    
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

        # Async command handlers
        async_actions = {
            StartCallCommand: lambda cmd: self.vapi_handler.start_call(cmd.variables, cmd.messages),
            StopCallCommand:  lambda cmd: self.vapi_handler.end_call(notify_vapi = True),
        }

        # Sync command handlers
        sync_actions = {
            PlayAudioCommand: lambda cmd: self.audio_player.play_audio(cmd.audio_name),
            SetVolumeCommand: lambda cmd: self.volume_handler.set_volume(cmd.level) if self.volume_handler else None,
            GetVolumeCommand: lambda cmd: self.client_handler.send_queue.put_nowait({
                "event_type": "volume-level",
                "available": self.volume_handler is not None,
                "level": self.volume_handler.get_volume() if self.volume_handler else None
            }),
        }

        async_action = async_actions.get(type(command))
        if async_action:
            await async_action(command)
            return

        sync_action = sync_actions.get(type(command))
        if sync_action:
            sync_action(command)

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
