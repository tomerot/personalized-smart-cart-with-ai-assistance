import subprocess
import re
from logger import logger


class VolumeHandler:
    """
    Handles system volume control in the production environment (Linux).
    """

    def set_volume(self, level: int):
        """Set system volume."""
        if not 0 <= level <= 100:
            logger.error(f"Invalid volume level: {level}. Must be 0-100.")
        
        try:
            subprocess.run(
                [
                    'pactl',              # PulseAudio control tool
                    'set-sink-volume',    # Command to change output volume
                    '@DEFAULT_SINK@',     # The current audio output
                    f'{level}%'           # The new volume level
                ],
                check=True,
                capture_output=True
            )
            logger.info(f"Volume set to {level}%.")
        
        except Exception as e:
            logger.error(f"Failed to set volume level.")
            logger.detail(f"{e}")
    

    def get_volume(self) -> int | None:
        """Get current system volume. Returns None if error occurs."""
        try:
            result = subprocess.run(
                [
                    'pactl',
                    'get-sink-volume',    # Command to read output volume
                    '@DEFAULT_SINK@'
                ],
                check=True,
                capture_output=True,
                text=True
            )
            match = re.search(r'(\d+)%', result.stdout)
            return int(match.group(1)) if match else None
        
        except Exception as e:
            logger.error(f"Failed to get volume level.")
            logger.detail(f"{e}")
            return None
