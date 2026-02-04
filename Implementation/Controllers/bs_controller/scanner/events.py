class Event:
    """Events the client is expected to consume and react to."""
    def to_dict(self):
        return self.__dict__

class BarcodeScannedEvent(Event):
    """Event carrying a scanned barcode string."""
    def __init__(self, barcode: str):
        self.event_type = "barcode-scanned"
        self.barcode = barcode

class InvalidBarcodeEvent(Event):
    """Event indicating a barcode that contains invalid character."""
    def __init__(self):
        self.event_type = "invalid-barcode"

class ScannerFailureEvent(Event):
    """Event indicating that the barcode scanner is unavailable due to a failure."""
    def __init__(self):
        self.event_type = "scanner-failure"