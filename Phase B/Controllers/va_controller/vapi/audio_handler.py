import asyncio
import pyaudio
import config
from logger import logger

class AudioHandler:
    """Manages microphone input and speaker output streams."""
    
    def __init__(self):
        self.pyaudio_instance = pyaudio.PyAudio()
        self.mic_stream = None
        self.speaker_stream = None
        self.mic_queue = asyncio.Queue()       # Mic -> VAPI Queue
        self.speaker_queue = asyncio.Queue()   # VAPI -> Speaker Queue
        self.player_task = None
        

    def start_microphone(self):
        """Start microphone input stream with callback."""
        self.mic_stream = self.pyaudio_instance.open(
            format = getattr(pyaudio, config.AUDIO_FORMAT),
            channels = config.AUDIO_CHANNELS,
            rate = config.AUDIO_RATE,
            input = True,
            frames_per_buffer = config.AUDIO_CHUNK_SIZE,
            stream_callback = self.__pyaudio_callback
        )

        # Initiates continuous microphone sampling and triggers the callback for each incoming PCM chunk
        self.mic_stream.start_stream()
        logger.info("Microphone stream started.")
    

    def mute_microphone(self):
        """Stop microphone stream - prevents echo."""
        if self.mic_stream and self.mic_stream.is_active():
            self.mic_stream.stop_stream()
            logger.info("Microphone muted.")
            
            # Clear any remaining microphone audio captured before muting to
            # prevent it from being transmitted when the microphone starts again
            count = 0
            while not self.mic_queue.empty():
                try:
                    self.mic_queue.get_nowait()
                    self.mic_queue.task_done()
                    count += 1
                except asyncio.QueueEmpty:
                    break
            logger.detail(f"Microphone queue flushed {count} chunks.")
    

    def unmute_microphone(self):
        """Restart microphone stream."""
        if self.mic_stream and not self.mic_stream.is_active():
            self.mic_stream.start_stream()
            logger.info("Microphone unmuted.")
    

    def start_speaker(self):
        """Initialize speaker output stream."""
        self.speaker_stream = self.pyaudio_instance.open(
            format = getattr(pyaudio, config.AUDIO_FORMAT),
            channels = config.AUDIO_CHANNELS,
            rate = config.AUDIO_RATE,
            output = True
        )
        # Initiates continuous speaker output and begins playback of queued PCM audio
        self.speaker_stream.start_stream()
        logger.info("Speaker stream started.")
    

    async def play_audio_loop(self):
        """Continuously plays audio chunks from the speaker queue until explicitly cancelled."""
        try:
            while True:
                audio_chunk = await self.speaker_queue.get() # Wait until there is an audio chunk in the queue
                try:
                    self.speaker_stream.write(audio_chunk)
                except Exception:
                    logger.warning(f"Could not write audio chunk to speaker stream.")
                self.speaker_queue.task_done()
        except asyncio.CancelledError: # Task cancelled
            logger.info("Audio player stopped.")
    

    def start_player_task(self) -> asyncio.Task:
        """Start the audio playback task."""
        self.player_task = asyncio.create_task(self.play_audio_loop())
        return self.player_task
    
    
    async def stop_audio_streams(self):
        """Stop and close all audio streams."""
        if self.player_task and not self.player_task.done():
            self.player_task.cancel() # Raises CancelledError exception
            try:
                await self.player_task # Wait for task to finish
            except asyncio.CancelledError:
                pass
        
        if self.mic_stream:
            if self.mic_stream.is_active():
                self.mic_stream.stop_stream()
            self.mic_stream.close()
            logger.info("Microphone stream closed.")
        
        if self.speaker_stream:
            if self.speaker_stream.is_active():
                self.speaker_stream.stop_stream()
            self.speaker_stream.close()
            logger.info("Speaker stream closed.")
        
        self.pyaudio_instance.terminate()


    def __pyaudio_callback(self, audio_chunk: bytes, frame_count: int, time_info: dict, status: int) -> tuple:
        """
        Handle a chunk of PCM audio delivered by PyAudio's real-time audio thread and
        place it into the microphone queue for consumption by the async WebSocket sender.

        The 'frame_count', 'time_info', and 'status' parameters are unused but must be
        present to match PyAudio's required callback signature.
        """ 
        try:
            # Insert the audio chunk (sent by PyAudio thread) into the outgoing queue
            self.mic_queue.put_nowait(audio_chunk) 
        except asyncio.QueueFull: 
            logger.warning("Microphone audio queue is full, dropping chunk.")
        # Indicate no output audio and request PyAudio to continue streaming
        return (None, pyaudio.paContinue)