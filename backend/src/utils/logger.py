"""
Logging configuration for CloudWatch
"""
import logging
import json
from datetime import datetime
from typing import Any, Dict


class CloudWatchFormatter(logging.Formatter):
    """
    Custom formatter for CloudWatch logs
    Outputs structured JSON logs
    """
    
    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        
        return json.dumps(log_data)


def setup_logging(log_level: str = "INFO") -> None:
    """
    Setup logging configuration
    """
    handler = logging.StreamHandler()
    handler.setFormatter(CloudWatchFormatter())
    
    logging.basicConfig(
        level=getattr(logging, log_level),
        handlers=[handler]
    )



