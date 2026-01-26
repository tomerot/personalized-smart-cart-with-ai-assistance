import pyaudio
import wave
import os
from logger import logger

class AlertAudioPlayer:
    """Plays pre-made audio files for fake voice assistant alerts."""
    
    ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")
    
    def __init__(self):
        self.pyaudio_instance = pyaudio.PyAudio()
    
    def play_alert(self, alert_name: str):
        """
        Play an audio alert by name.
        Looks for a WAV file in the assets folder matching the alert_name.
        """
        file_path = os.path.join(self.ASSETS_DIR, f"{alert_name}.wav")
        
        if not os.path.exists(file_path):
            logger.error(f"Alert audio file not found: {file_path}")
            return False
        
        try:
            with wave.open(file_path, 'rb') as wf:
                stream = self.pyaudio_instance.open(
                    format=self.pyaudio_instance.get_format_from_width(wf.getsampwidth()),
                    channels=wf.getnchannels(),
                    rate=wf.getframerate(),
                    output=True
                )
                
                chunk_size = 1024
                data = wf.readframes(chunk_size)
                
                while data:
                    stream.write(data)
                    data = wf.readframes(chunk_size)
                
                stream.stop_stream()
                stream.close()
                
            logger.info(f"Alert '{alert_name}' played successfully.")
            return True
            
        except Exception as e:
            logger.error(f"Failed to play alert '{alert_name}': {e}")
            return False
    
    def close(self):
        """Clean up PyAudio resources."""
        self.pyaudio_instance.terminate()