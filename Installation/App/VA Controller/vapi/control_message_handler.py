import json
from .events import *
from logger import logger

class ControlMessageHandler:
    """Parses VAPI control messages and converts relevant ones into typed events."""

    def __init__(self):
        # Registry that maps incoming message types to their respective handle method
        self.handler_map = {
            "speech-update": self.__handle_assistant_speech_update,
            "transcript": self.__handle_user_transcript,
            "model-output": self.__handle_model_tokens,
            "tool-calls": self.__handle_tool_calls,
            "tool.completed": self.__handle_tool_completed,
            "hang": self.__handle_unexpected_call_end,
            "hangup": self.__handle_expected_call_end
        }

    def route(self, message: str) -> Event | None:
        """Route a control message to its handler and return the event."""
        try:
            msg_json = json.loads(message)
        except json.JSONDecodeError:
            logger.warning(f"Received non-JSON text message from VAPI.")
            return None
        
        try:
            msg_type = msg_json["type"]
        except KeyError as e:
            logger.error("Received control message. Key 'type' missing.")
            return None 
        
        handler = self.handler_map.get(msg_type)
        if handler:
            return handler(msg_json)
            
        logger.warning(f"Received unknown control message type: '{msg_type}' from VAPI.")
        return None
        

    def __handle_assistant_speech_update(self, msg: dict) -> AssistantSpeechUpdateEvent | None:
        """Extracts assistant speech state changes."""
        try:
            if msg["role"] != "assistant": # Handling assistant speech updates only
                return None
            
            status = msg["status"]
            if status == "started":
                logger.info("Assistant speaking.")
                return AssistantSpeechUpdateEvent(speaking = True)
            elif status == "stopped":
                logger.info("Assistant stopped speaking.")
                return AssistantSpeechUpdateEvent(speaking = False)
            else:
                logger.warning(f"Received unknown status '{status}' in 'speech-update' control message.")
                return None
        
        except KeyError as e:
            self.__log_missing_key(e.args[0], "speech-update") # e.args[0] contains the name of the missing key
            return None


    def __handle_user_transcript(self, msg: dict) -> UserTranscriptEvent | None:
        """Extracts user transcripts."""
        try:
            if msg["role"] != "user": # Handling user transcriptions only
                return None
            
            transcript = msg["transcript"]
            is_final = True if msg["transcriptType"] == "final" else False
            if is_final:
                logger.info(f"Received user final transcript.")
                logger.detail(f"Transcript: '{transcript}'")
            return UserTranscriptEvent(transcript, is_final)
        
        except KeyError as e:
            self.__log_missing_key(e.args[0], "transcript")
            return None


    def __handle_model_tokens(self, msg: dict) -> ModelOutputEvent | None:
        """Extracts model output speech tokens."""
        try:
            output = msg["output"]
            
            if not isinstance(output, str): # Structured objects are not handled
                return None
            
            logger.info(f"Received LLM token: '{output}'")
            return ModelOutputEvent(output)
        
        except KeyError as e:
            self.__log_missing_key(e.args[0], "model-output")
            return None


    def __handle_tool_calls(self, msg: dict) -> ToolCallEvent | EndCallEvent | None:
        """Extracts tool request information."""
        try:
            tool_call = msg["toolCallList"][0] # Assuming only one tool is called at once
            name = tool_call["function"]["name"]
            arguments = tool_call["function"]["arguments"]
            execution_id = tool_call["id"] # Unique identifier for this specific call of the tool
            logger.info(f"Tool '{name}' was called.")
            return ToolCallEvent(name, arguments, execution_id)
        
        except KeyError as e:
            self.__log_missing_key(e.args[0], "tool-calls")
            return None
        

    def __handle_tool_completed(self, msg: dict) -> ToolCallResultEvent | None:
        """Extracts tool execution results."""
        try:
            message = msg["messages"][0] # Assuming only one tool is complete
            name = message["name"]
            result = message["result"]
            execution_id = message["toolCallId"]
            logger.info(f"Received '{name}' tool results.")
            if name == "end_call":
                return None
            return ToolCallResultEvent(name, result, execution_id)
        
        except KeyError as e:
            self.__log_missing_key(e.args[0], "tool.completed")
            return None
    

    def __handle_unexpected_call_end(self, msg: dict) -> EndCallEvent:
        """Handles unexpected call termination."""
        logger.error("Call ended by VAPI unexpectedly, received 'hang' control message.")
        return EndCallEvent(expected = False)

    def __handle_expected_call_end(self, msg: dict) -> EndCallEvent:
        """Handles cases where VAPI ends the call intentionally, due to policy violation."""
        logger.info("Received 'hangup' control message.")
        return EndCallEvent(expected = True, reason = "POLICY_VIOLATION") # Hangup is sent from VAPI due to policy violation

    def __log_missing_key(self, key: str, control_message: str):
        logger.error(f"Key '{key}' missing in '{control_message}' control message.'")