class Command:
    """Commands received from the client that the controller is expected to execute."""
    pass

class StartCallCommand(Command):
    """Command instructing to start a new call with VAPI."""
    def __init__(self, variables: dict):
        self.variables = variables

class StopCallCommand(Command):
    """Command instructing to stop a call with VAPI."""
    pass

class EndSessionCommand(Command):
    """Command instructing to terminate the client session and stop logging."""
    pass