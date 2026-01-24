import Chat from "@/components/chat/Chat";
import { useVoiceAssistant } from "../context/VoiceAssistantContext";

/**
 * CompanionView Component
 * Displays the Smart Companion chat interface with voice assistant integration
 */
export default function CompanionView() {
  const {
    isConversationActive,
    chatStatus,
    timerProgress,
    messages,
    toggleConversation,
  } = useVoiceAssistant();

  return (
    <Chat
      isConversationActive={isConversationActive}
      onStartStop={toggleConversation}
      status={chatStatus}
      timerProgress={timerProgress}
      messages={messages}
    />
  );
}

