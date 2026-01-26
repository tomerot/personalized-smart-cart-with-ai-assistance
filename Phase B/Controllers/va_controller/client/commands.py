class Command:
    """Commands received from the client that the controller is expected to execute."""
    pass

class StartCallCommand(Command):
    """Command instructing to start a new call with VAPI."""
    def __init__(self, variables: dict, messages: list):
        self.variables = variables
        self.messages = messages # Can be empty, if no previous messages are available

class StopCallCommand(Command):
    """Command instructing to stop a call with VAPI."""
    pass

class EndSessionCommand(Command):
    """Command instructing to terminate the client session and stop logging."""
    pass

class PlayAlertCommand(Command):
    """Command instructing to play a pre-made audio alert."""
    def __init__(self, alert_name: str):
        self.alert_name = alert_name