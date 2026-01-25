import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { voiceControllerService, VOICE_EVENT_TYPES } from "@/services/voiceControllerService";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";
import { getToolCallMessage } from "@/data/toolCallMessages";

const VoiceAssistantContext = createContext();

/**
 * VoiceAssistantProvider
 * Manages the state and actions for the voice assistant feature
 * Handles WebSocket communication with va_controller
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - Child components
 */
export function VoiceAssistantProvider({ children }) {
  // Core conversation state
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [chatStatus, setChatStatus] = useState('idle'); // 'idle' | 'connecting' | 'assistant' | 'user'
  const [timerProgress, setTimerProgress] = useState(0);
  
  // Messages state - persisted through the whole session
  const [messages, setMessages] = useState([]);
  
  // User context for variables
  const { user } = useUser();
  
  // Cart context for last scanned barcode
  const { cartItems } = useCart();
  
  // Pending assistant output (held until assistant actually starts speaking)
  const pendingAssistantOutputRef = useRef('');
  
  // Track if current call has started (to differentiate new call from continued conversation)
  const callStartedRef = useRef(false);
  
  // Track if we've received the first user message in the current call
  // Used to prevent concatenation with previous call's last user message
  const isFirstUserMessageInCallRef = useRef(true);
  
  // Track last speaker for transcription concatenation
  const lastSpeakerRef = useRef(null); // 'user' | 'assistant' | null

  // Track active tool calls - stores { executionId: { name: toolName, result?: parsedResult } } mapping
  const activeToolCallsRef = useRef(new Map());
  
  // Store the last tool call result data for rendering with the assistant response
  const lastToolCallResultRef = useRef(null);

  // Track the product ID that was sent when starting the conversation
  // Used to highlight the product in the cart during the conversation
  const [highlightedProductId, setHighlightedProductId] = useState(null);

  // Track unread conflict notifications (show red dot on Smart Companion nav)
  const [hasUnreadConflict, setHasUnreadConflict] = useState(false);

  // Tracks if user activity was detected in the current turn
  // Once detected, timer stops for the rest of this turn
  const [activityDetectedInTurn, setActivityDetectedInTurn] = useState(false);

  // Timer configuration (in milliseconds) - matches vapi_handler.py silence timeout
  const INACTIVITY_TIMEOUT = 5000; // 5 seconds to fill the bar (same as backend)
  const TIMER_INTERVAL = 100; // Update every 100ms for smooth animation

  /**
   * Timer effect - runs when user is supposed to speak AND no activity detected yet
   * Fills the progress bar from 0 to 100 over INACTIVITY_TIMEOUT duration
   * Stops completely once USER_ACTIVITY_DETECTED is received for this turn
   */
  useEffect(() => {
    let intervalId = null;
    
    // Only run timer if:
    // 1. It's user's turn to speak
    // 2. Conversation is active
    // 3. No activity has been detected yet in this turn
    if (chatStatus === 'user' && isConversationActive && !activityDetectedInTurn) {
      // Reset progress to 0 at the start
      setTimerProgress(0);
      
      // Start the timer
      const startTime = Date.now();
      
      intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / INACTIVITY_TIMEOUT) * 100, 100);
        setTimerProgress(progress);
      }, TIMER_INTERVAL);
    } else {
      // Reset timer when not user's turn or activity detected
      setTimerProgress(0);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [chatStatus, isConversationActive, activityDetectedInTurn]);

  /**
   * Load messages from sessionStorage on mount
   */
  useEffect(() => {
    const storedMessages = sessionStorage.getItem('voiceMessages');
    if (storedMessages) {
      try {
        const messagesData = JSON.parse(storedMessages);
        setMessages(messagesData);
        // Restore last speaker from the last message
        if (messagesData.length > 0) {
          lastSpeakerRef.current = messagesData[messagesData.length - 1].type;
        }
      } catch (error) {
        console.error('Failed to parse stored messages:', error);
        sessionStorage.removeItem('voiceMessages');
      }
    }
  }, []);

  /**
   * Save messages to sessionStorage whenever they change
   */
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('voiceMessages', JSON.stringify(messages));
    }
  }, [messages]);

  /**
   * Always track the top product in cart for highlighting
   * The top product is the one whose barcode will be sent to voice assistant
   */
  useEffect(() => {
    if (cartItems.length > 0) {
      setHighlightedProductId(cartItems[0].id);
      console.log('🎨 Top product highlighted:', cartItems[0].name, 'ID:', cartItems[0].id);
    } else {
      setHighlightedProductId(null);
      console.log('🎨 Cart empty, no highlight');
    }
  }, [cartItems]);

  /**
   * Handle incoming events from va_controller
   */
  const handleVoiceEvent = useCallback((event) => {
    const eventType = event.event_type;
    
    switch (eventType) {
      case VOICE_EVENT_TYPES.START_CALL:
        // Call has started successfully
        if (event.started) {
          console.log('🎙️ Voice call started');
          callStartedRef.current = true;
          isFirstUserMessageInCallRef.current = true; // Reset for new call
          setChatStatus('user'); // Default to "Speak..." when call starts
        } else {
          // Call failed to start
          console.error('Voice call failed to start');
          setIsConversationActive(false);
          setChatStatus('idle');
        }
        break;
        
      case VOICE_EVENT_TYPES.END_CALL:
        console.log('🎙️ Voice call ended', event.expected ? 'expectedly' : 'unexpectedly');
        
        // Handle POLICY_VIOLATION: remove last user message as it caused the violation
        if (event.reason === 'POLICY_VIOLATION') {
          console.warn('Call ended due to policy violation, removing last user message');
          setMessages(prev => {
            // Find and remove the last user message
            const lastUserIndex = [...prev].reverse().findIndex(msg => msg.type === 'user');
            if (lastUserIndex !== -1) {
              const actualIndex = prev.length - 1 - lastUserIndex;
              const newMessages = [...prev.slice(0, actualIndex), ...prev.slice(actualIndex + 1)];
              // Update lastSpeakerRef based on new last message
              if (newMessages.length > 0) {
                lastSpeakerRef.current = newMessages[newMessages.length - 1].type;
              } else {
                lastSpeakerRef.current = null;
              }
              return newMessages;
            }
            return prev;
          });
          // TODO: Show error modal to user about policy violation
        } else if (!event.expected) {
          // TODO: Show error modal to user about unexpected end
          console.warn('Call ended unexpectedly:', event.reason);
        }
        
        setIsConversationActive(false);
        setChatStatus('idle');
        setTimerProgress(0);
        callStartedRef.current = false;
        isFirstUserMessageInCallRef.current = true;
        pendingAssistantOutputRef.current = '';
        break;
        
      case VOICE_EVENT_TYPES.ASSISTANT_SPEAKING:
        if (event.speaking) {
          // Assistant started speaking - this marks the start of a new turn cycle
          setChatStatus('assistant');
          setActivityDetectedInTurn(false); // Reset for next user turn
          
          // Show the pending assistant output now that it's actually speaking
          if (pendingAssistantOutputRef.current) {
            const assistantContent = pendingAssistantOutputRef.current;
            pendingAssistantOutputRef.current = '';
            
            // Check if we have a tool call result to render
            const toolResult = lastToolCallResultRef.current;
            lastToolCallResultRef.current = null; // Clear after use
            
            // Build the message object - store data, not React components (for sessionStorage serialization)
            let messageData;
            if (toolResult && toolResult.name === 'get_product_info') {
              // Store the data needed to render ProductLocationContent
              messageData = {
                type: 'assistant',
                content: assistantContent,
                showConflict: false,
                toolCallData: {
                  name: toolResult.name,
                  productLocation: toolResult.data
                }
              };
            } else if (toolResult && toolResult.name === 'get_ai_alternatives') {
              // Store the data needed to render ProductAlternatives
              // Response structure: { alternatives: [...], explanation: "string" }
              // Get the current highlighted product ID at the time of the tool call
              const currentHighlightedId = cartItems.length > 0 ? cartItems[0].id : null;
              messageData = {
                type: 'assistant',
                content: assistantContent,
                showConflict: false,
                forProductId: currentHighlightedId, // Track which product this is for
                toolCallData: {
                  name: toolResult.name,
                  alternatives: toolResult.data.alternatives || [],
                  explanation: toolResult.data.explanation || ''
                }
              };
            } else {
              messageData = {
                type: 'assistant',
                content: assistantContent,
                showConflict: false
              };
            }
            
            setMessages(prev => {
              // Check if the last message has a tool call (shimmer text)
              if (prev.length > 0) {
                const lastMessage = prev[prev.length - 1];
                
                // If the last message is an assistant message with a tool call, replace its content
                if (lastMessage.type === 'assistant' && lastMessage.toolCallId) {
                  console.log('Replacing shimmer text with actual tool result');
                  return [
                    ...prev.slice(0, -1),
                    messageData
                  ];
                }
                
                // Check if we should concatenate to the last message (normal flow)
                // Only concatenate plain text, not special components
                if (lastSpeakerRef.current === 'assistant' && lastMessage.type === 'assistant' && !toolResult && !lastMessage.toolCallData) {
                  // Append to existing assistant message
                  return [
                    ...prev.slice(0, -1),
                    { ...lastMessage, content: lastMessage.content + ' ' + assistantContent }
                  ];
                }
              }
              
              // Add new assistant message
              lastSpeakerRef.current = 'assistant';
              return [...prev, messageData];
            });
          }
        } else {
          // Assistant stopped speaking, user can now speak
          setChatStatus('user');
        }
        break;
        
      case VOICE_EVENT_TYPES.MODEL_OUTPUT:
        // Hold the assistant output until AssistantSpeechUpdateEvent with speaking=true
        // Accumulate output in case it comes in chunks
        pendingAssistantOutputRef.current += event.output;
        break;
        
      case VOICE_EVENT_TYPES.USER_TRANSCRIPT:
        // Handle user transcription
        if (event.text && event.text.trim()) {
          const userText = event.text.trim();
          
          setMessages(prev => {
            // Only concatenate if:
            // 1. The last speaker was the user (same turn)
            // 2. This is NOT the first user message in the current call
            //    (prevents concatenation with previous call's last user message)
            // 3. The last message exists and is a user message
            const shouldConcatenate = 
              lastSpeakerRef.current === 'user' &&
              !isFirstUserMessageInCallRef.current &&
              prev.length > 0 &&
              prev[prev.length - 1].type === 'user';
            
            if (shouldConcatenate) {
              const lastMessage = prev[prev.length - 1];
              // Concatenate with space
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: lastMessage.content + ' ' + userText }
              ];
            }
            
            // Add new user message
            lastSpeakerRef.current = 'user';
            isFirstUserMessageInCallRef.current = false; // No longer the first user message
            return [...prev, { type: 'user', content: userText, showConflict: false }];
          });
        }
        break;
        
      case VOICE_EVENT_TYPES.USER_ACTIVITY_DETECTED:
        // Stop the timer for this turn - user is actively speaking
        // Timer will only restart in the next turn (after assistant speaks)
        setActivityDetectedInTurn(true);
        break;
        
      case VOICE_EVENT_TYPES.TOOL_CALL:
        // Handle tool call by showing loading message if configured
        console.log('Tool call received:', event.name, event.arguments);
        
        const toolMessage = getToolCallMessage(event.name);
        if (toolMessage) {
          // Store the active tool call with its name
          activeToolCallsRef.current.set(event.execution_id, { name: event.name });
          
          // Add a temporary assistant message with loading state (shimmer will be rendered in Chat)
          setMessages(prev => {
            // Check if we should concatenate to the last message
            if (lastSpeakerRef.current === 'assistant' && prev.length > 0) {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage.type === 'assistant' && !lastMessage.isLoading) {
                // Append loading state to existing assistant message
                return [
                  ...prev.slice(0, -1),
                  { 
                    ...lastMessage, 
                    isLoading: true,
                    loadingText: toolMessage,
                    toolCallId: event.execution_id
                  }
                ];
              }
            }
            
            // Add new assistant message with loading state
            lastSpeakerRef.current = 'assistant';
            return [...prev, { 
              type: 'assistant', 
              content: '',
              showConflict: false,
              isLoading: true,
              loadingText: toolMessage,
              toolCallId: event.execution_id
            }];
          });
        }
        break;
        
      case VOICE_EVENT_TYPES.TOOL_CALL_RESULT:
        // Tool call completed - the result will be spoken by the assistant
        console.log('Tool call result:', event.name, event.result);
        
        // Parse and store the result for use when rendering the assistant message
        if (event.name === 'get_product_info' || event.name === 'get_ai_alternatives') {
          try {
            const parsedResult = typeof event.result === 'string' 
              ? JSON.parse(event.result) 
              : event.result;
            lastToolCallResultRef.current = { name: event.name, data: parsedResult };
          } catch (e) {
            console.error('Failed to parse tool call result:', e);
            lastToolCallResultRef.current = null;
          }
        }
        
        // Remove the tool call from active tracking
        activeToolCallsRef.current.delete(event.execution_id);
        
        // The actual result will be delivered via MODEL_OUTPUT and ASSISTANT_SPEAKING events
        // We need to replace the shimmer message with the actual content when it arrives
        break;
        
      default:
        console.log('Unknown voice event:', eventType);
    }
  }, []);

  /**
   * Subscribe to voice events on mount
   */
  useEffect(() => {
    const unsubscribe = voiceControllerService.onEvent(handleVoiceEvent);
    return () => unsubscribe();
  }, [handleVoiceEvent]);

  /**
   * Start a voice conversation
   */
  const startConversation = useCallback(() => {
    if (!user) {
      console.error('Cannot start conversation: No user logged in');
      return;
    }

    // Check if connected to voice controller
    if (!voiceControllerService.isConnected()) {
      console.error('Cannot start conversation: Not connected to voice controller');
      return;
    }

    console.log('🎙️ Starting voice conversation');
    
    // Reset state for new call
    callStartedRef.current = false;
    isFirstUserMessageInCallRef.current = true; // Will be set to false after first user message
    pendingAssistantOutputRef.current = '';
    // Don't reset lastSpeakerRef - we want to track across the session for display purposes
    
    setIsConversationActive(true);
    setChatStatus('connecting');
    setTimerProgress(0);

    // Get the last scanned/added product's barcode (first item in cart is most recent)
    const lastBarcode = cartItems.length > 0 ? (cartItems[0].barcode || cartItems[0].id || '') : '';

    // Prepare variables for VAPI
    const variables = {
      phone: user.phone, // Should already start with +9725
      allergies: user.allergies || [],
      dietary_needs: user.dietary_needs || [],
      barcode: lastBarcode,
    };

    // Prepare messages for context (convert to VAPI format)
    const formattedMessages = messages.length > 0 
      ? messages.map(msg => ({
          role: msg.type, // 'user' or 'assistant'
          content: msg.content,
        }))
      : [];

    // Start the call with variables and previous messages
    voiceControllerService.startCall(variables, formattedMessages);
  }, [user, messages, cartItems]);

  /**
   * Stop the current voice conversation
   */
  const stopConversation = useCallback(() => {
    console.log('🎙️ Stopping voice conversation');
    
    voiceControllerService.stopCall();
    
    setIsConversationActive(false);
    setChatStatus('idle');
    setTimerProgress(0);
    callStartedRef.current = false;
    isFirstUserMessageInCallRef.current = true;
    pendingAssistantOutputRef.current = '';
    // Don't clear highlightedProductId - it should stay on the top product
  }, []);

  /**
   * Toggle conversation state
   */
  const toggleConversation = useCallback(() => {
    if (isConversationActive) {
      stopConversation();
    } else {
      startConversation();
    }
  }, [isConversationActive, startConversation, stopConversation]);

  /**
   * Clear all messages (e.g., when user logs out)
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    lastSpeakerRef.current = null;
    sessionStorage.removeItem('voiceMessages');
  }, []);

  /**
   * Add a message manually (for system messages or testing)
   */
  const addMessage = useCallback((type, content, showConflict = false) => {
    setMessages(prev => [...prev, { type, content, showConflict }]);
    lastSpeakerRef.current = type;
  }, []);

  /**
   * Add a conflict message with alternatives
   * Called when a scanned product conflicts with user preferences
   * @param {object} conflictData - Conflict data from product scan
   * @param {object} conflictData.originalProduct - The original scanned product
   * @param {object} conflictData.conflict - Conflict details { allergen_conflicts, dietary_conflicts, details }
   * @param {Array} conflictData.alternatives - Array of alternative products
   */
  const addConflictMessage = useCallback((conflictData) => {
    const { originalProduct, conflict, alternatives } = conflictData;
    
    // Get the product ID to track which product this conflict is for
    const productId = originalProduct.barcode || originalProduct.id;
    
    const messageData = {
      type: 'assistant',
      content: 'I found a conflict with at least one of your dietary needs or allergies:',
      showConflict: true,
      forProductId: productId, // Track which product this is for
      conflictData: {
        originalProduct,
        allergenConflicts: conflict.allergen_conflicts || [],
        dietaryConflicts: conflict.dietary_conflicts || [],
        details: conflict.details || '',
        alternatives: alternatives || [],
      },
    };
    
    setMessages(prev => [...prev, messageData]);
    lastSpeakerRef.current = 'assistant';
    
    // Set unread conflict notification (shows red dot on Smart Companion nav)
    setHasUnreadConflict(true);
    
    // TODO: Later - trigger pre-made voice for conflict notification
  }, []);

  /**
   * Mark conflict notifications as read (clears the red dot)
   * Called when user navigates to Smart Companion view
   */
  const markConflictsAsRead = useCallback(() => {
    setHasUnreadConflict(false);
  }, []);

  const value = {
    // State
    isConversationActive,
    chatStatus,
    timerProgress,
    messages,
    highlightedProductId,
    hasUnreadConflict,
    
    // Actions
    toggleConversation,
    startConversation,
    stopConversation,
    clearMessages,
    addMessage,
    addConflictMessage,
    markConflictsAsRead,
    
    // Setters for external control
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

