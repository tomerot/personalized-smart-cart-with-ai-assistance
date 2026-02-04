import pyaudio
import wave
import os
import config
from logger import logger


class AudioPlayer:
    """Handles playback of pre-made WAV audio files."""
    
    # Absolute path to the directory containing audio assets
    ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")
    
    def __init__(self):
        self.pyaudio_instance = pyaudio.PyAudio()
    
    def play_audio(self, audio_name: str):
        """
        Play an audio by name.
        Looks for a WAV file in the assets folder.
        """

        # Build the full path to the requested audio file
        file_path = os.path.join(self.ASSETS_DIR, f"{audio_name}.wav")
        
        # Validate that the audio file exists before attempting playback
        if not os.path.exists(file_path):
            logger.error(f"Audio file not found: {file_path}")
            return
        
        try:
            # Open the WAV file and read its audio format metadata
            with wave.open(file_path, 'rb') as wf:
                # Create an output audio stream matching the WAV file parameters
                stream = self.pyaudio_instance.open(
                    format=self.pyaudio_instance.get_format_from_width(wf.getsampwidth()),
                    channels=wf.getnchannels(),
                    rate=wf.getframerate(),
                    output=True
                )
                
                 # Read and play the audio in chunks to avoid loading the entire file into memory
                chunk_size = config.AUDIO_CHUNK_SIZE
                data = wf.readframes(chunk_size)
                
                while data:
                    stream.write(data)
                    data = wf.readframes(chunk_size)
                
                # Explicitly stop and release the audio stream resources
                stream.stop_stream()
                stream.close()
                
            logger.info(f"Audio '{audio_name}' played successfully.")
            
        except Exception:
            logger.error(f"Failed to play audio '{audio_name}'.")