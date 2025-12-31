class Command:
    """Commands received from the client that the controller is expected to execute."""
    pass

class EnableScannerCommand(Command):
    """Command instructing to enable barcode processing."""
    pass

class DisableScannerCommand(Command):
    """Command instructing to disable barcode processing."""
    pass

class EndSessionCommand(Command):
    """Command instructing to terminate the client session and stop logging."""
    pass