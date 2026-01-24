/**
 * WebSocket Test Page
 * 
 * Use this page to test WebSocket connections to the Raspberry Pi controllers.
 * Access at: /test/websocket
 * 
 * This is a development tool and should be removed before production build.
 */

import { useState, useEffect } from 'react';
import { controllerService } from '@/services/controllerService';

function WebSocketTest() {
  const [connectionStatus, setConnectionStatus] = useState({
    barcode: false,
    voice: false,
  });
  const [events, setEvents] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const addEvent = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvents(prev => [...prev, { type, message, timestamp }].slice(-20)); // Keep last 20 events
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    addEvent('info', 'Connecting to controllers...');
    
    const result = await controllerService.connect();
    
    setConnectionStatus({
      barcode: result.barcode,
      voice: result.voice,
    });
    
    if (result.barcode) {
      addEvent('success', '✓ Barcode Scanner connected');
    } else {
      addEvent('error', '✗ Barcode Scanner failed to connect');
    }
    
    if (result.voice) {
      addEvent('success', '✓ Voice Assistant connected');
    } else {
      addEvent('error', '✗ Voice Assistant failed to connect');
    }
    
    setIsConnecting(false);
  };

  const handleDisconnect = () => {
    controllerService.disconnect();
    setConnectionStatus({ barcode: false, voice: false });
    addEvent('info', 'Disconnected from all controllers');
  };

  const handleEnableScanner = () => {
    if (controllerService.enableScanner()) {
      addEvent('info', 'Sent: Enable Scanner command');
    } else {
      addEvent('error', 'Failed to send command (not connected)');
    }
  };

  const handleDisableScanner = () => {
    if (controllerService.disableScanner()) {
      addEvent('info', 'Sent: Disable Scanner command');
    } else {
      addEvent('error', 'Failed to send command (not connected)');
    }
  };

  const handleStartVoice = () => {
    if (controllerService.startVoiceCall()) {
      addEvent('info', 'Sent: Start Voice Call command');
    } else {
      addEvent('error', 'Failed to send command (not connected)');
    }
  };

  const handleStopVoice = () => {
    if (controllerService.stopVoiceCall()) {
      addEvent('info', 'Sent: Stop Voice Call command');
    } else {
      addEvent('error', 'Failed to send command (not connected)');
    }
  };

  useEffect(() => {
    // Listen for barcode events
    const unsubBarcode = controllerService.onBarcodeEvent((message) => {
      if (message.event_type === 'barcode-scanned') {
        addEvent('barcode', `Barcode Scanned: ${message.barcode}`);
      } else if (message.event_type === 'invalid-barcode') {
        addEvent('warning', 'Invalid Barcode detected');
      } else if (message.event_type === 'scanner-failure') {
        addEvent('error', 'Scanner hardware failure');
      } else {
        addEvent('barcode', `Barcode Event: ${JSON.stringify(message)}`);
      }
    });

    // Listen for voice events
    const unsubVoice = controllerService.onVoiceEvent((message) => {
      addEvent('voice', `Voice Event: ${message.event_type || message.type}`);
    });

    // Listen for connection changes
    const unsubConnection = controllerService.onConnectionChange(({ type, connected }) => {
      setConnectionStatus(prev => ({
        ...prev,
        [type]: connected,
      }));
      
      if (connected) {
        addEvent('success', `${type} controller connected`);
      } else {
        addEvent('warning', `${type} controller disconnected`);
      }
    });

    return () => {
      unsubBarcode();
      unsubVoice();
      unsubConnection();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          WebSocket Connection Test
        </h1>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Connection Status
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full ${connectionStatus.barcode ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-700">Barcode Scanner</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full ${connectionStatus.voice ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-700">Voice Assistant</span>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Controls
          </h2>
          
          {/* Connection Controls */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Connection</h3>
            <div className="flex gap-2">
              <button
                onClick={handleConnect}
                disabled={isConnecting || (connectionStatus.barcode && connectionStatus.voice)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={!connectionStatus.barcode && !connectionStatus.voice}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Barcode Scanner Controls */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Barcode Scanner</h3>
            <div className="flex gap-2">
              <button
                onClick={handleEnableScanner}
                disabled={!connectionStatus.barcode}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Enable Scanner
              </button>
              <button
                onClick={handleDisableScanner}
                disabled={!connectionStatus.barcode}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Disable Scanner
              </button>
            </div>
          </div>

          {/* Voice Assistant Controls */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Voice Assistant</h3>
            <div className="flex gap-2">
              <button
                onClick={handleStartVoice}
                disabled={!connectionStatus.voice}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Start Call
              </button>
              <button
                onClick={handleStopVoice}
                disabled={!connectionStatus.voice}
                className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Stop Call
              </button>
            </div>
          </div>
        </div>

        {/* Event Log */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Event Log
            </h2>
            <button
              onClick={() => setEvents([])}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear
            </button>
          </div>
          
          <div className="bg-gray-50 rounded p-4 h-96 overflow-y-auto font-mono text-sm">
            {events.length === 0 ? (
              <p className="text-gray-500 italic">No events yet...</p>
            ) : (
              events.map((event, index) => (
                <div
                  key={index}
                  className={`mb-2 pb-2 border-b border-gray-200 ${
                    event.type === 'error' ? 'text-red-600' :
                    event.type === 'success' ? 'text-green-600' :
                    event.type === 'warning' ? 'text-yellow-600' :
                    event.type === 'barcode' ? 'text-blue-600' :
                    event.type === 'voice' ? 'text-purple-600' :
                    'text-gray-700'
                  }`}
                >
                  <span className="text-gray-400">[{event.timestamp}]</span>{' '}
                  <span className="font-semibold">{event.type.toUpperCase()}:</span>{' '}
                  {event.message}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            💡 Instructions
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Make sure both controllers are running on the Raspberry Pi</li>
            <li>2. Click "Connect" to establish WebSocket connections</li>
            <li>3. Use the control buttons to send commands</li>
            <li>4. Scan barcodes to see events in the log</li>
            <li>5. Watch the event log for real-time updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default WebSocketTest;

