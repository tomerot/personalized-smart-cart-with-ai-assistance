import json
from .commands import *
from logger import logger

class ClientMessageHandler:
    """Parses client messages and converts them into typed commands."""

    def __init__(self):
        # Registry that maps incoming command messages to their respective typed command.
        self.cmd_map = {
            "start-call": StartCallCommand,
            "stop-call": StopCallCommand,
            "end-session": EndSessionCommand
        }

    def handle(self, message: str) -> Command:
        """"""
        command = json.loads(message) # Client is trusted to send only valid JSON messages
        cmd_type = command.pop("cmd_type") # Remove 'cmd_type' to leave only arguments
        constructor = self.cmd_map.get(cmd_type)
        
        if constructor:
            logger.info(f"Received {cmd_type} command from client.")
            try:
                # Dynamically create the command object using the remaining keys as kwargs
                return constructor(**command)
            except TypeError:
                logger.error(f"Argument mismatch for command '{cmd_type}'.")
                return None
        
        # No constructor was found
        logger.error(f"[ERROR] Received unknown command type '{cmd_type}' from client.")
        return None