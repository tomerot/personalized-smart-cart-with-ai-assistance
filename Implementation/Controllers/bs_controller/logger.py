import logging
import os
import config
from datetime import datetime

# Register a custom level
DETAIL_LVL = 15
logging.addLevelName(DETAIL_LVL, "DETAIL")

class __Logger:
    """
    Logger that writes to both console and a log file.
    """

    def __init__(self, file_dir: str = config.LOG_FILE_PATH):
        self.logger = None
        self.file_dir = file_dir # Log file directory
        self.session_id = None
        self.file_handler = None
        self.console_handler = None
        

    def start_session(self):
        """
        Creates a logging session file and configures handlers.
        """
        # Generate session ID with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S") # ISO-style, lexicographically sortable timestamp
        self.session_id = f"session_{timestamp}"
        
        # Create logs directory if it doesn't exist
        os.makedirs(self.file_dir, exist_ok = True)
        
        # Create logger
        self.logger = logging.getLogger(self.session_id)
        self.logger.setLevel(logging.DEBUG)
        self.logger.propagate = False  # Prevent log propagation to the default root logger
        
        # Clear any existing handlers
        self.logger.handlers.clear()
        
        # File handler (plain text)
        log_file = os.path.join(self.file_dir, f"{self.session_id}.log")
        self.file_handler = logging.FileHandler(log_file, mode = 'w')
        self.file_handler.setLevel(logging.DEBUG)
        file_formatter = logging.Formatter('[%(asctime)s] [%(levelname)s] %(message)s',
                                          datefmt = '%Y-%m-%d %H:%M:%S')
        self.file_handler.setFormatter(file_formatter)
        self.logger.addHandler(self.file_handler)
        
        # Console handler
        self.console_handler = logging.StreamHandler()
        self.console_handler.setLevel(logging.DEBUG)
        console_formatter = ColoredFormatter('[%(asctime)s] [%(levelname)s] %(message)s',
                                            datefmt = '%Y-%m-%d %H:%M:%S')
        self.console_handler.setFormatter(console_formatter)
        self.logger.addHandler(self.console_handler)
        
    
    def stop_session(self):
        """Close the logger and flush all handlers."""
        if self.logger:
            self.info("Session ended.")
            
            # Flush and close handlers
            if self.file_handler:
                self.file_handler.flush()
                self.file_handler.close()
                self.logger.removeHandler(self.file_handler)
            
            if self.console_handler:
                self.console_handler.flush()
                self.console_handler.close()
                self.logger.removeHandler(self.console_handler)
            
            self.logger = None
            self.session_id = None
    

    def info(self, message: str):
        """Log INFO level message."""
        if self.logger:
            self.logger.info(message)
        else:
            # Fallback for pre-session logs
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"\033[92m[{timestamp}] [INFO] {message}\033[0m")
    

    def error(self, message: str):
        """Log ERROR level message."""
        if self.logger:
            self.logger.error(message)
    

    def warning(self, message: str):
        """Log WARNING level message."""
        if self.logger:
            self.logger.warning(message)
    

    def detail(self, message: str):
        """Log DETAIL level message."""
        if self.logger:
            self.logger.log(DETAIL_LVL, message)


class ColoredFormatter(logging.Formatter):
    """Custom formatter that adds colors to console output."""
    
    COLORS = {
        'DEBUG': "\033[90m",     # Gray
        'INFO': '\033[92m',      # Green
        'ERROR': '\033[91m',     # Red
        'WARNING': '\033[93m',   # Yellow-Orange
        'RESET': '\033[0m'
    }
    

    def __init__(self, fmt, datefmt, style = "%"):
        super().__init__(fmt = fmt, datefmt = datefmt, style = style)
        self._last_color = None
    

    def format(self, record):
        """Format log record with colors for console output."""
        # Get the base formatted message
        log_message = super().format(record)
        level_name = record.levelname
        
        if level_name == 'DETAIL':
            color = self._last_color
        else:
            color = self.COLORS.get(level_name)
        
        if color:
            self._last_color = color
            return f"{color}{log_message}{self.COLORS['RESET']}"
        
        return log_message


logger = __Logger() # Create a single logger instance that all modules will import