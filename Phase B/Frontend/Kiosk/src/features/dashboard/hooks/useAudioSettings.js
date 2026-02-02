import { useState, useRef, useEffect, useCallback } from "react";
import { voiceControllerService } from "@/services/voiceControllerService";

/**
 * Custom hook to manage Audio Settings modal state and volume control
 */
export function useAudioSettings() {
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [volume, setVolume] = useState(50); // Default volume
  const [isLoading, setIsLoading] = useState(false);
  const [isVolumeControlAvailable, setIsVolumeControlAvailable] = useState(true); // Assume available until told otherwise
  const [isConnected, setIsConnected] = useState(false);
  const audioButtonRef = useRef(null);

  // Listen for volume events from the controller
  useEffect(() => {
    const unsubscribe = voiceControllerService.onEvent((message) => {
      if (message.event_type === 'volume-level') {
        // Update availability status
        if (typeof message.available === 'boolean') {
          setIsVolumeControlAvailable(message.available);
        }
        
        // Update volume level if available
        if (typeof message.level === 'number') {
          console.log('Received volume level:', message.level);
          setVolume(message.level);
        }
        
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Request volume status when voice controller connects
  useEffect(() => {
    // Set initial connection status
    setIsConnected(voiceControllerService.isConnected());
    
    const unsubscribe = voiceControllerService.onConnectionChange((connected) => {
      setIsConnected(connected);
      
      if (connected) {
        // Request volume status to check availability
        voiceControllerService.getVolume();
      }
    });

    return () => unsubscribe();
  }, []);

  // Request current volume when modal opens
  useEffect(() => {
    if (showAudioSettings && voiceControllerService.isConnected() && isVolumeControlAvailable) {
      setIsLoading(true);
      voiceControllerService.getVolume();
      
      // Timeout in case we don't get a response
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [showAudioSettings, isVolumeControlAvailable]);

  const handleAudioSettingsClick = useCallback(() => {
    if (isVolumeControlAvailable && isConnected) {
      setShowAudioSettings(true);
    }
  }, [isVolumeControlAvailable, isConnected]);

  const handleCloseAudioSettings = useCallback(() => {
    setShowAudioSettings(false);
  }, []);

  const handleVolumeChange = useCallback((newVolume) => {
    // Clamp volume between 0 and 100
    const clampedVolume = Math.max(0, Math.min(100, Math.round(newVolume)));
    setVolume(clampedVolume);
    
    // Send volume change to controller
    if (voiceControllerService.isConnected()) {
      voiceControllerService.setVolume(clampedVolume);
    }
  }, []);

  return {
    showAudioSettings,
    setShowAudioSettings,
    volume,
    isLoading,
    isVolumeControlAvailable: isVolumeControlAvailable && isConnected, // Both must be true
    audioButtonRef,
    handleAudioSettingsClick,
    handleCloseAudioSettings,
    handleVolumeChange,
  };
}
