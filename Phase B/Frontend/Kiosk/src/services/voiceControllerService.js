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
  RECONNECT_DELAY: 3000, // 3 seconds
  MAX_RECONNECT_ATTEMPTS: 5,
};

// Command Types
export const VOICE_COMMANDS = {
  START_CALL: { cmd_type: 'start-call' },
  STOP_CALL: { cmd_type: 'stop-call' },
  END_SESSION: { cmd_type: 'end-session' },
};

// Event Types
export const VOICE_EVENT_TYPES = {
  SPEECH_UPDATE: 'speech-update',
  TRANSCRIPT: 'transcript',
  MODEL_OUTPUT: 'model-output',
};

class VoiceControllerService {
  constructor() {
    // WebSocket connection
    this.ws = null;

    // Connection state
    this.connected = false;

    // Reconnection tracking
    this.reconnectAttempts = 0;

    // Event listeners
    this.eventListeners = [];
    this.connectionListeners = [];
  }

  /**
   * Connect to Voice Assistant Controller
   * @returns {Promise<boolean>} Success status
   */
  connect() {
    return new Promise((resolve) => {
      try {
        console.log(`Connecting to Voice Assistant Controller at ${WS_CONFIG.URL}...`);
        
        this.ws = new WebSocket(WS_CONFIG.URL);

        this.ws.onopen = () => {
          console.log('✓ Connected to Voice Assistant Controller');
          this.connected = true;
          this.reconnectAttempts = 0;
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
          this._notifyConnectionListeners(false);
          
          // Attempt to reconnect
          if (this.reconnectAttempts < WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect to Voice Assistant (${this.reconnectAttempts}/${WS_CONFIG.MAX_RECONNECT_ATTEMPTS})...`);
            setTimeout(() => this.connect(), WS_CONFIG.RECONNECT_DELAY);
          }
          
          resolve(false);
        };

        // Timeout if connection takes too long
        setTimeout(() => {
          if (!this.connected) {
            console.error('Voice Assistant connection timeout');
            this.ws?.close();
            resolve(false);
          }
        }, 5000);

      } catch (error) {
        console.error('Failed to connect to Voice Assistant:', error);
        resolve(false);
      }
    });
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
   * @returns {boolean} Success status
   */
  startCall() {
    console.log('Starting voice assistant call...');
    return this._sendCommand(VOICE_COMMANDS.START_CALL);
  }

  /**
   * Stop voice assistant call
   * @returns {boolean} Success status
   */
  stopCall() {
    console.log('Stopping voice assistant call...');
    return this._sendCommand(VOICE_COMMANDS.STOP_CALL);
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
   * Disconnect from the controller
   */
  disconnect() {
    console.log('Disconnecting from Voice Assistant controller...');

    // Send end session command before closing
    if (this.connected) {
      this._sendCommand(VOICE_COMMANDS.END_SESSION);
    }

    // Close connection
    this.ws?.close();

    this.connected = false;
    this.ws = null;

    console.log('Disconnected from Voice Assistant controller');
  }
}

// Export singleton instance
export const voiceControllerService = new VoiceControllerService();

