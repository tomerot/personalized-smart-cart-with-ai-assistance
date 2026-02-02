/**
 * Voice Assistant Controller Service
 * Manages WebSocket connection to Raspberry Pi Voice Assistant Controller (va_controller)
 */

// WebSocket Configuration
const WS_CONFIG = {
  HOST: 'localhost',
  PORT: 8765,
  get URL() {
    return `ws://${this.HOST}:${this.PORT}`;
  },
  INITIAL_RECONNECT_DELAY: 3000, // 3 seconds for first 5 attempts
  CONTINUOUS_RECONNECT_DELAY: 30000, // 30 seconds for continuous retries
  MAX_FAST_RECONNECT_ATTEMPTS: 5, // Number of fast reconnect attempts before switching to slower interval
};

// Command Types - matches va_controller/client/commands.py
export const VOICE_COMMANDS = {
  START_CALL: 'start-call',
  STOP_CALL: 'stop-call',
  END_SESSION: 'end-session',
  PLAY_AUDIO: 'play-audio',
  SET_VOLUME: 'set-volume',
  GET_VOLUME: 'get-volume',
};

// Event Types - matches va_controller/vapi/events.py
export const VOICE_EVENT_TYPES = {
  ASSISTANT_SPEAKING: 'assistant-speaking',
  USER_TRANSCRIPT: 'user-transcript',
  MODEL_OUTPUT: 'model-output',
  TOOL_CALL: 'tool-call',
  TOOL_CALL_RESULT: 'tool-call-result',
  START_CALL: 'start-call',
  END_CALL: 'end-call',
  USER_ACTIVITY_DETECTED: 'user-activity-detected',
};

class VoiceControllerService {
  constructor() {
    // WebSocket connection
    this.ws = null;

    // Connection state
    this.connected = false;

    // Reconnection tracking
    this.reconnectAttempts = 0;
    this.isConnecting = false; // Prevent multiple simultaneous connection attempts
    this.reconnectTimer = null;
    
    // Dashboard-aware reconnection
    this.shouldReconnect = false; // Set to true when on dashboard, false when leaving
    this.manualDisconnect = false; // Track if disconnect was intentional

    // Event listeners
    this.eventListeners = [];
    this.connectionListeners = [];
  }

  /**
   * Connect to Voice Assistant Controller
   * @returns {Promise<boolean>} Success status
   */
  connect() {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('Already connecting, skipping duplicate connection attempt');
      return Promise.resolve(this.connected);
    }

    // If already connected, return success
    if (this.connected && this.ws) {
      console.log('Already connected to Voice Assistant');
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      try {
        this.isConnecting = true;
        console.log(`Connecting to Voice Assistant Controller at ${WS_CONFIG.URL}...`);
        
        this.ws = new WebSocket(WS_CONFIG.URL);

        this.ws.onopen = () => {
          console.log('✓ Connected to Voice Assistant Controller');
          this.connected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0; // Reset counter on successful connection
          this._notifyConnectionListeners(true);
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this._handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('Voice Assistant WebSocket error:', error);
        };

        this.ws.onclose = () => {
          console.warn('Voice Assistant connection closed');
          this.connected = false;
          this.isConnecting = false;
          this._notifyConnectionListeners(false);
          
          // Clear any existing reconnect timer
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }
          
          // Attempt to reconnect if we should be connected (on dashboard) and not manually disconnected
          if (this.shouldReconnect && !this.manualDisconnect) {
            this._scheduleReconnect();
          }
          
          resolve(false);
        };

        // Timeout if connection takes too long
        setTimeout(() => {
          if (!this.connected) {
            console.error('Voice Assistant connection timeout');
            this.isConnecting = false;
            this.ws?.close();
            resolve(false);
          }
        }, 5000);

      } catch (error) {
        console.error('Failed to connect to Voice Assistant:', error);
        this.isConnecting = false;
        resolve(false);
      }
    });
  }

  /**
   * Schedule a reconnection attempt with appropriate delay
   * Uses fast retry for first few attempts, then switches to slower continuous retry
   * @private
   */
  _scheduleReconnect() {
    // Determine delay based on attempt count
    const delay = this.reconnectAttempts < WS_CONFIG.MAX_FAST_RECONNECT_ATTEMPTS
      ? WS_CONFIG.INITIAL_RECONNECT_DELAY
      : WS_CONFIG.CONTINUOUS_RECONNECT_DELAY;
    
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= WS_CONFIG.MAX_FAST_RECONNECT_ATTEMPTS) {
      console.log(`Attempting to reconnect to Voice Assistant (${this.reconnectAttempts}/${WS_CONFIG.MAX_FAST_RECONNECT_ATTEMPTS} fast attempts)...`);
    } else {
      console.log(`Attempting to reconnect to Voice Assistant (continuous retry, attempt #${this.reconnectAttempts})...`);
    }
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Handle incoming messages from Voice Assistant Controller
   * @param {string} data - Raw message data
   */
  _handleMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('Received from Voice Assistant:', message);
      
      // Notify listeners
      this.eventListeners.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          console.error('Error in voice event listener:', error);
        }
      });
    } catch (error) {
      console.error('Failed to parse voice message:', error);
    }
  }

  /**
   * Notify connection status listeners
   * @param {boolean} connected - Connection status
   */
  _notifyConnectionListeners(connected) {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('Error in connection event listener:', error);
      }
    });
  }

  /**
   * Send a command to the Voice Assistant Controller
   * @param {object} command - Command to send
   */
  _sendCommand(command) {
    if (!this.connected || !this.ws) {
      console.warn('Cannot send command: Voice Assistant not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(command));
      console.log('Sent to Voice Assistant:', command);
      return true;
    } catch (error) {
      console.error('Failed to send voice command:', error);
      return false;
    }
  }

  // ===== Public API Methods =====

  /**
   * Start voice assistant call
   * @param {object} variables - User variables { phone, allergies, dietary_needs, barcode }
   * @param {Array} messages - Previous messages for context [{ role: 'user'|'assistant', content: string }]
   * @returns {boolean} Success status
   */
  startCall(variables, messages = []) {
    console.log('Starting voice assistant call with variables:', variables);
    return this._sendCommand({
      cmd_type: VOICE_COMMANDS.START_CALL,
      variables: variables,
      messages: messages,
    });
  }

  /**
   * Stop voice assistant call
   * @returns {boolean} Success status
   */
  stopCall() {
    console.log('Stopping voice assistant call...');
    return this._sendCommand({ cmd_type: VOICE_COMMANDS.STOP_CALL });
  }

  /**
   * Play a pre-made audio alert
   * @param {string} audioName - Name of the audio file (without extension)
   * @returns {boolean} Success status
   */
  playAudio(audioName) {
    console.log(`Playing audio: ${audioName}`);
    return this._sendCommand({
      cmd_type: VOICE_COMMANDS.PLAY_AUDIO,
      audio_name: audioName,
    });
  }

  /**
   * Set system volume level
   * @param {number} level - Volume level (0-100)
   * @returns {boolean} Success status
   */
  setVolume(level) {
    console.log(`Setting volume to: ${level}%`);
    return this._sendCommand({
      cmd_type: VOICE_COMMANDS.SET_VOLUME,
      level: level,
    });
  }

  /**
   * Request current volume level
   * Response will be received via event listener with event_type: 'volume-level'
   * @returns {boolean} Success status
   */
  getVolume() {
    console.log('Requesting current volume level...');
    return this._sendCommand({
      cmd_type: VOICE_COMMANDS.GET_VOLUME,
    });
  }

  /**
   * Register event listener for voice assistant events
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onEvent(callback) {
    this.eventListeners.push(callback);
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Register event listener for connection status changes
   * @param {Function} callback - Callback function (receives boolean)
   * @returns {Function} Unsubscribe function
   */
  onConnectionChange(callback) {
    this.connectionListeners.push(callback);
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current connection status
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Enable continuous reconnection (call when entering dashboard)
   * This starts the connection process and enables automatic reconnection
   */
  enableContinuousReconnect() {
    console.log('Voice Assistant: Enabling continuous reconnection (dashboard active)');
    this.shouldReconnect = true;
    this.manualDisconnect = false;
    
    // If not connected, start connecting
    if (!this.connected && !this.isConnecting) {
      this.reconnectAttempts = 0; // Reset counter for fresh start
      this.connect();
    }
  }

  /**
   * Disable continuous reconnection (call when leaving dashboard)
   * This stops any reconnection attempts but doesn't disconnect if already connected
   */
  disableContinuousReconnect() {
    console.log('Voice Assistant: Disabling continuous reconnection (leaving dashboard)');
    this.shouldReconnect = false;
    
    // Clear any pending reconnection attempts
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Disconnect from the controller
   * This is an intentional disconnect (e.g., user logout)
   */
  disconnect() {
    console.log('Disconnecting from Voice Assistant controller...');

    // Mark as manual disconnect to prevent auto-reconnect
    this.manualDisconnect = true;
    this.shouldReconnect = false;

    // Clear any pending reconnection attempts
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Send end session command before closing
    if (this.connected) {
      this._sendCommand({ cmd_type: VOICE_COMMANDS.END_SESSION });
    }

    // Close connection
    this.ws?.close();

    this.connected = false;
    this.isConnecting = false;
    this.ws = null;

    console.log('Disconnected from Voice Assistant controller');
  }
}

// Export singleton instance
export const voiceControllerService = new VoiceControllerService();

