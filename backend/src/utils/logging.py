import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path


def setup_logging(
    log_level: str = "INFO",
    log_to_console: bool = True,
    log_to_file: bool = True,
    log_file: str = None,
    log_format: str = None,
):
    """
    Set up logging configuration for the application.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_to_console: Whether to log to console
        log_to_file: Whether to log to file
        log_file: Path to log file (default: ./logs/app.log)
        log_format: Log format string
    """
    # Define log format
    if log_format is None:
        log_format = "%(asctime)s %(levelname)s:%(name)s: %(message)s"

    # Parse log level
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create formatter
    formatter = logging.Formatter(log_format)
    
    # Console handler
    if log_to_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)
    
    # File handler
    if log_to_file:
        if log_file is None:
            # Create logs directory if it doesn't exist
            logs_dir = Path("./logs")
            logs_dir.mkdir(exist_ok=True)
            log_file = str(logs_dir / "app.log")
        
        # Create rotating file handler (10MB max, keep 5 backups)
        file_handler = RotatingFileHandler(
            log_file, maxBytes=10*1024*1024, backupCount=5
        )
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
    
    # Special handling for third-party loggers
    # Set higher log level for chatty libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    
    # Create a separate file for OpenAI API calls if needed
    openai_logger = logging.getLogger("openai")
    openai_logger.setLevel(numeric_level)
    
    if log_to_file:
        openai_log_file = str(Path("./logs") / "openai.log")
        openai_handler = RotatingFileHandler(
            openai_log_file, maxBytes=10*1024*1024, backupCount=3
        )
        openai_handler.setFormatter(formatter)
        openai_logger.addHandler(openai_handler)
    
    # Log startup info
    logging.info("Logging system initialized")
    logging.debug(f"Log level set to {log_level}")


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the given name.
    
    Args:
        name: Logger name
        
    Returns:
        Logger instance
    """
    return logging.getLogger(name)


class LoggerMixin:
    """Mixin to add logging capabilities to a class."""
    
    @property
    def logger(self):
        """Get a logger for this class."""
        if not hasattr(self, "_logger"):
            self._logger = logging.getLogger(f"{self.__class__.__module__}.{self.__class__.__name__}")
        return self._logger


# Environment-aware setup function
def setup_environment_logging():
    """
    Set up logging based on environment variables.
    
    Environment variables:
        LOG_LEVEL: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        LOG_TO_FILE: Whether to log to file (true/false)
        LOG_FILE: Path to log file
    """
    log_level = os.environ.get("LOG_LEVEL", "INFO")
    log_to_file = os.environ.get("LOG_TO_FILE", "true").lower() == "true"
    log_file = os.environ.get("LOG_FILE", None)
    
    setup_logging(
        log_level=log_level,
        log_to_file=log_to_file,
        log_file=log_file
    )


# If run directly, set up logging with default settings
if __name__ == "__main__":
    setup_logging(log_level="DEBUG")
    logger = get_logger(__name__)
    
    logger.debug("This is a debug message")
    logger.info("This is an info message")
    logger.warning("This is a warning message")
    logger.error("This is an error message")
    logger.critical("This is a critical message")