import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";

/**
 * ChatBar Component
 * 
 * A chat bar component for voice assistant conversation control.
 * 
 * Features:
 * - Start/Stop conversation button with timer stroke
 * - Status display (Connecting, Assistant Speaking, User Speaking)
 * - Animated status indicators
 * 
 * @param {boolean} isConversationActive - Whether conversation is active
 * @param {function} onStartStop - Callback when start/stop button is clicked
 * @param {string} status - Current status: 'idle', 'connecting', 'assistant', 'user'
 * @param {number} timerProgress - Progress of inactivity timer (0-100)
 * @param {string} className - Additional CSS classes
 */
const ChatBar = ({
  isConversationActive = false,
  onStartStop,
  status = 'idle', // 'idle' | 'connecting' | 'assistant' | 'user'
  timerProgress = 0,
  className = "",
}) => {
  // Show timer stroke only when it's the user's turn to speak
  const showTimerStroke = status === 'user';

  return (
    <div 
      className={`flex items-center justify-center ${className}`}
    >
      {/* Fixed-width container that holds both button and status side by side */}
      <div 
        className="flex items-center gap-6"
        style={{
          // Fixed total width when conversation is active to prevent shifting
          width: isConversationActive ? '470px' : 'auto',
          justifyContent: 'center',
          transition: 'width 0.5s ease-in-out',
        }}
      >
        {/* Start/Stop Conversation Button with Timer Fill */}
        <div 
          className="relative shrink-0"
          style={{
            transition: 'transform 0.5s ease-in-out',
          }}
        >
          {/* Button */}
          <button
            onClick={onStartStop}
            className={`
              relative
              font-semibold
              text-lg
              px-6 py-3
              rounded-xl
              transition-all duration-300
              cursor-pointer
              flex items-center gap-3
              overflow-hidden
              ${isConversationActive 
                ? 'bg-white border-3 border-green-600' 
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800 border-3 border-green-600'
              }
            `}
          >
            {/* Fill bar that grows from left to right - only when user speaking */}
            {showTimerStroke && (
              <div
                className="absolute bg-green-600"
                style={{
                  top: '4px',
                  bottom: '4px',
                  left: '4px',
                  width: `calc(${timerProgress}% - 8px)`,
                  borderRadius: '8px',
                  transition: 'width 0.1s linear',
                }}
              />
            )}
            
            {/* Content layer - green text when active, white when not */}
            <div className="relative z-10 flex items-center gap-3">
              <Icon
                name={isConversationActive ? ICONS.STOP_CONVERSATION : ICONS.START_CONVERSATION}
                size={24}
                weight={500}
                fill={1}
                style={{ color: isConversationActive ? '#16a34a' : 'white' }}
              />
              <span 
                className="font-[Montserrat]"
                style={{ color: isConversationActive ? '#16a34a' : 'white' }}
              >
                {isConversationActive ? "Stop Conversation" : "Start Conversation"}
              </span>
            </div>

            {/* Overlay layer - white text that shows through the fill */}
            {showTimerStroke && (
              <div 
                className="absolute flex items-center justify-center gap-3 z-20"
                style={{
                  top: '4px',
                  bottom: '4px',
                  left: '4px',
                  right: '4px',
                  clipPath: `inset(0 ${100 - timerProgress}% 0 0)`,
                  transition: 'clip-path 0.1s linear',
                }}
              >
                <Icon
                  name={ICONS.STOP_CONVERSATION}
                  size={24}
                  weight={500}
                  fill={1}
                  style={{ color: 'white' }}
                />
                <span className="font-[Montserrat] text-white font-semibold text-lg">
                  Stop Conversation
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Status Display - Fixed width to prevent layout shift */}
        <div 
          className="flex flex-col items-center"
          style={{
            width: isConversationActive ? '170px' : '0px',
            opacity: status !== 'idle' ? 1 : 0,
            overflow: 'visible',
            transition: 'width 0.5s ease-in-out, opacity 0.3s ease-in-out',
          }}
        >
          {/* Status Icon/Animation - On top */}
          <div className="relative w-6 h-6 flex items-center justify-center mb-1">
            {status === 'connecting' && (
              // Loading spinner
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
            )}
            {status === 'assistant' && (
              <Icon
                name={ICONS.MUTE}
                size={24}
                weight={500}
                fill={1}
                style={{ color: "#000000" }}
              />
            )}
            {status === 'user' && (
              <Icon
                name={ICONS.UNMUTE}
                size={24}
                weight={500}
                fill={1}
                style={{ color: "#000000" }}
              />
            )}
          </div>

          {/* Status Text - Below icon */}
          <span
            className={`font-[Montserrat] text-sm font-medium text-gray-600 whitespace-nowrap ${
              status === 'assistant' || status === 'user' ? 'pulse-animation' : ''
            }`}
            style={
              status === 'assistant' || status === 'user'
                ? { animationDuration: '2s' }
                : {}
            }
          >
            {status === 'connecting' && 'Connecting...'}
            {status === 'assistant' && 'Assistant Speaking...'}
            {status === 'user' && 'Speak...'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBar;

