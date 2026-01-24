/**
 * Barcode Scanner Controller Service
 * Manages WebSocket connection to Raspberry Pi Barcode Scanner Controller (bs_controller)
 */

// WebSocket Configuration
const WS_CONFIG = {
  HOST: 'localhost',
  PORT: 8766,
  get URL() {
    return `ws://${this.HOST}:${this.PORT}`;
  },
  RECONNECT_DELAY: 3000, // 3 seconds
  MAX_RECONNECT_ATTEMPTS: 5,
};

// Command Types
export const BARCODE_COMMANDS = {
  ENABLE_SCANNER: { cmd_type: 'enable-scanner' },
  DISABLE_SCANNER: { cmd_type: 'disable-scanner' },
  END_SESSION: { cmd_type: 'end-session' },
};

// Event Types
export const BARCODE_EVENT_TYPES = {
  BARCODE_SCANNED: 'barcode-scanned',
  INVALID_BARCODE: 'invalid-barcode',
  SCANNER_FAILURE: 'scanner-failure',
};

class BarcodeControllerService {
  constructor() {
    // WebSocket connection
    this.ws = null;

    // Connection state
    this.connected = false;

    // Reconnection tracking
    this.reconnectAttempts = 0;
    this.isConnecting = false; // Prevent multiple simultaneous connection attempts
    this.reconnectTimer = null;

    // Event listeners
    this.eventListeners = [];
    this.connectionListeners = [];
  }

  /**
   * Connect to Barcode Scanner Controller
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
      console.log('Already connected to Barcode Scanner');
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      try {
        this.isConnecting = true;
        console.log(`Connecting to Barcode Scanner Controller at ${WS_CONFIG.URL}...`);
        
        this.ws = new WebSocket(WS_CONFIG.URL);

        this.ws.onopen = () => {
          console.log('✓ Connected to Barcode Scanner Controller');
          this.connected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this._notifyConnectionListeners(true);
          
          // Enable scanner on successful connection
          this.enableScanner();
          
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this._handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('Barcode Scanner WebSocket error:', error);
        };

        this.ws.onclose = () => {
          console.warn('Barcode Scanner connection closed');
          this.connected = false;
          this.isConnecting = false;
          this._notifyConnectionListeners(false);
          
          // Clear any existing reconnect timer
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }
          
          // Attempt to reconnect only if not manually disconnected
          if (this.reconnectAttempts < WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect to Barcode Scanner (${this.reconnectAttempts}/${WS_CONFIG.MAX_RECONNECT_ATTEMPTS})...`);
            this.reconnectTimer = setTimeout(() => {
              this.reconnectTimer = null;
              this.connect();
            }, WS_CONFIG.RECONNECT_DELAY);
          } else {
            console.error('Max reconnection attempts reached');
          }
          
          resolve(false);
        };

        // Timeout if connection takes too long
        setTimeout(() => {
          if (!this.connected) {
            console.error('Barcode Scanner connection timeout');
            this.isConnecting = false;
            this.ws?.close();
            resolve(false);
          }
        }, 5000);

      } catch (error) {
        console.error('Failed to connect to Barcode Scanner:', error);
        this.isConnecting = false;
        resolve(false);
      }
    });
  }

  /**
   * Handle incoming messages from Barcode Scanner Controller
   * @param {string} data - Raw message data
   */
  _handleMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('Received from Barcode Scanner:', message);
      
      // Notify listeners
      this.eventListeners.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          console.error('Error in barcode event listener:', error);
        }
      });
    } catch (error) {
      console.error('Failed to parse barcode message:', error);
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
   * Send a command to the Barcode Scanner Controller
   * @param {object} command - Command to send
   */
  _sendCommand(command) {
    if (!this.connected || !this.ws) {
      console.warn('Cannot send command: Barcode Scanner not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(command));
      console.log('Sent to Barcode Scanner:', command);
      return true;
    } catch (error) {
      console.error('Failed to send barcode command:', error);
      return false;
    }
  }

  // ===== Public API Methods =====

  /**
   * Enable the barcode scanner
   * @returns {boolean} Success status
   */
  enableScanner() {
    console.log('Enabling barcode scanner...');
    return this._sendCommand(BARCODE_COMMANDS.ENABLE_SCANNER);
  }

  /**
   * Disable the barcode scanner
   * @returns {boolean} Success status
   */
  disableScanner() {
    console.log('Disabling barcode scanner...');
    return this._sendCommand(BARCODE_COMMANDS.DISABLE_SCANNER);
  }

  /**
   * Register event listener for barcode scanner events
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
    console.log('Disconnecting from Barcode Scanner controller...');

    // Clear any pending reconnection attempts
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Stop reconnection attempts
    this.reconnectAttempts = WS_CONFIG.MAX_RECONNECT_ATTEMPTS;

    // Send end session command before closing
    if (this.connected) {
      this._sendCommand(BARCODE_COMMANDS.END_SESSION);
    }

    // Close connection
    this.ws?.close();

    this.connected = false;
    this.isConnecting = false;
    this.ws = null;

    console.log('Disconnected from Barcode Scanner controller');
  }
}

// Export singleton instance
export const barcodeControllerService = new BarcodeControllerService();

