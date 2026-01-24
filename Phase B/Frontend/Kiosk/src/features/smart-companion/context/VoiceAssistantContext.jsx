import { createContext, useContext, useState } from "react";

const VoiceAssistantContext = createContext();

/**
 * VoiceAssistantProvider
 * Manages the state and actions for the voice assistant feature
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - Child components
 */
export function VoiceAssistantProvider({ children }) {
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [chatStatus, setChatStatus] = useState('idle');
  const [timerProgress, setTimerProgress] = useState(0);
  const [messages, setMessages] = useState([]);

  const startConversation = () => {
    setIsConversationActive(true);
    // TODO: Connect to voice assistant service
    console.log("🎙️ Starting voice conversation");
  };

  const stopConversation = () => {
    setIsConversationActive(false);
    setChatStatus('idle');
    setTimerProgress(0);
    // TODO: Disconnect from voice assistant service
    console.log("🎙️ Stopping voice conversation");
  };

  const toggleConversation = () => {
    if (isConversationActive) {
      stopConversation();
    } else {
      startConversation();
    }
  };

  const value = {
    isConversationActive,
    chatStatus,
    timerProgress,
    messages,
    toggleConversation,
    setChatStatus,
    setTimerProgress,
    setMessages,
  };

  return (
    <VoiceAssistantContext.Provider value={value}>
      {children}
    </VoiceAssistantContext.Provider>
  );
}

/**
 * Hook to access voice assistant context
 * @throws {Error} If used outside of VoiceAssistantProvider
 */
export function useVoiceAssistant() {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error("useVoiceAssistant must be used within VoiceAssistantProvider");
  }
  return context;
}

