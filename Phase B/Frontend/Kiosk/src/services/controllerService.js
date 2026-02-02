/**
 * Controller Service - Unified Facade
 * Provides a unified interface to both Barcode Scanner and Voice Assistant controllers
 * This maintains backward compatibility with existing code while delegating to separate services
 */

import { barcodeControllerService, BARCODE_COMMANDS, BARCODE_EVENT_TYPES } from './barcodeControllerService.js';
import { voiceControllerService, VOICE_COMMANDS, VOICE_EVENT_TYPES } from './voiceControllerService.js';

class ControllerService {
  constructor() {
    // Event listeners for unified connection tracking
    this.connectionListeners = [];
    
    // Set up connection listeners
    barcodeControllerService.onConnectionChange((connected) => {
      this._notifyConnectionListeners('barcode', connected);
    });
    
    voiceControllerService.onConnectionChange((connected) => {
      this._notifyConnectionListeners('voice', connected);
    });
  }

  /**
   * Initialize connections to both controllers
   * @returns {Promise<{barcode: boolean, voice: boolean}>} Connection statuses
   */
  async connect() {
    console.log('Initializing connections to Raspberry Pi controllers...');
    
    const results = await Promise.allSettled([
      barcodeControllerService.connect(),
      voiceControllerService.connect(),
    ]);

    const barcodeResult = results[0].status === 'fulfilled' && results[0].value;
    const voiceResult = results[1].status === 'fulfilled' && results[1].value;

    console.log('Connection results:', {
      barcodeScanner: barcodeResult ? 'Connected' : 'Failed',
      voiceAssistant: voiceResult ? 'Connected' : 'Failed',
    });

    return {
      barcode: barcodeResult,
      voice: voiceResult,
    };
  }

  /**
   * Enable continuous reconnection for both controllers
   * Call this when user enters the dashboard
   */
  enableContinuousReconnect() {
    console.log('Enabling continuous reconnection for all controllers (dashboard active)');
    barcodeControllerService.enableContinuousReconnect();
    voiceControllerService.enableContinuousReconnect();
  }

  /**
   * Disable continuous reconnection for both controllers
   * Call this when user leaves the dashboard
   */
  disableContinuousReconnect() {
    console.log('Disabling continuous reconnection for all controllers (leaving dashboard)');
    barcodeControllerService.disableContinuousReconnect();
    voiceControllerService.disableContinuousReconnect();
  }

  /**
   * Notify connection status listeners
   * @param {string} type - 'barcode' or 'voice'
   * @param {boolean} connected - Connection status
   */
  _notifyConnectionListeners(type, connected) {
    this.connectionListeners.forEach(listener => {
      try {
        listener({ type, connected });
      } catch (error) {
        console.error('Error in connection event listener:', error);
      }
    });
  }

  // ===== Public API Methods =====

  /**
   * Enable the barcode scanner
   * @returns {boolean} Success status
   */
  enableScanner() {
    return barcodeControllerService.enableScanner();
  }

  /**
   * Disable the barcode scanner
   * @returns {boolean} Success status
   */
  disableScanner() {
    return barcodeControllerService.disableScanner();
  }

  /**
   * Start voice assistant call
   * @param {object} variables - User variables { phone, allergies, dietary_needs }
   * @param {Array} messages - Previous messages for context
   * @returns {boolean} Success status
   */
  startVoiceCall(variables = {}, messages = []) {
    return voiceControllerService.startCall(variables, messages);
  }

  /**
   * Stop voice assistant call
   * @returns {boolean} Success status
   */
  stopVoiceCall() {
    return voiceControllerService.stopCall();
  }

  /**
   * Register event listener for barcode scanner events
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onBarcodeEvent(callback) {
    return barcodeControllerService.onEvent(callback);
  }

  /**
   * Register event listener for voice assistant events
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onVoiceEvent(callback) {
    return voiceControllerService.onEvent(callback);
  }

  /**
   * Register event listener for connection status changes
   * @param {Function} callback - Callback function (receives {type, connected})
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
   * @returns {{barcode: boolean, voice: boolean}}
   */
  getConnectionStatus() {
    return {
      barcode: barcodeControllerService.isConnected(),
      voice: voiceControllerService.isConnected(),
    };
  }

  /**
   * Disconnect from all controllers
   */
  disconnect() {
    console.log('Disconnecting from all controllers...');
    barcodeControllerService.disconnect();
    voiceControllerService.disconnect();
    console.log('Disconnected from all controllers');
  }

  /**
   * Check if both controllers are connected
   * @returns {boolean}
   */
  isFullyConnected() {
    return barcodeControllerService.isConnected() && voiceControllerService.isConnected();
  }

  /**
   * Check if at least one controller is connected
   * @returns {boolean}
   */
  isPartiallyConnected() {
    return barcodeControllerService.isConnected() || voiceControllerService.isConnected();
  }
}

// Export singleton instance
export const controllerService = new ControllerService();

// Export individual services
export { barcodeControllerService, voiceControllerService };

// Export constants for external use
export const COMMANDS = {
  ...BARCODE_COMMANDS,
  ...VOICE_COMMANDS,
};

export const EVENT_TYPES = {
  ...BARCODE_EVENT_TYPES,
  ...VOICE_EVENT_TYPES,
};

