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
  
  // WebSocket connection state
  const [isVoiceControllerConnected, setIsVoiceControllerConnected] = useState(false);
  
  // Messages state - persisted through the whole session
  const [messages, setMessages] = useState([]);
  
  // User context for variables
  const { user, updateUser } = useUser();
  
  // Cart context for last scanned barcode
  const { cartItems } = useCart();
  
  // Ref to always access current cartItems (avoids stale closure in event handlers)
  const cartItemsRef = useRef(cartItems);
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);
  
  // Ref to always access current user (avoids stale closure in event handlers)
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  
  // Ref for updateUser to avoid stale closure
  const updateUserRef = useRef(updateUser);
  useEffect(() => {
    updateUserRef.current = updateUser;
  }, [updateUser]);
  
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

  // Tracks if user activity was detected in the current turn
  // Once detected, timer stops for the rest of this turn
  const [activityDetectedInTurn, setActivityDetectedInTurn] = useState(false);

  // Error modals state
  const [showPolicyViolationModal, setShowPolicyViolationModal] = useState(false);
  const [showUnexpectedEndModal, setShowUnexpectedEndModal] = useState(false);

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
    } else {
      setHighlightedProductId(null);
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
        // Handle POLICY_VIOLATION: remove last user message as it caused the violation
        if (event.reason === 'POLICY_VIOLATION') {
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
          setShowPolicyViolationModal(true);
        } else if (!event.expected) {
          setShowUnexpectedEndModal(true);
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
              // Use ref to always get the latest cart state (avoids stale closure)
              const currentHighlightedId = cartItemsRef.current.length > 0 ? cartItemsRef.current[0].id : null;
              
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
          
          // Check if there's any remaining pending output that arrived after speaking started
          if (pendingAssistantOutputRef.current) {
            const remainingContent = pendingAssistantOutputRef.current;
            pendingAssistantOutputRef.current = '';
            
            setMessages(prev => {
              if (prev.length > 0 && prev[prev.length - 1].type === 'assistant') {
                const lastMessage = prev[prev.length - 1];
                return [
                  ...prev.slice(0, -1),
                  { ...lastMessage, content: lastMessage.content + remainingContent }
                ];
              }
              return prev;
            });
          }
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
        // Store the active tool call with its name AND arguments (needed for allergy/dietary updates)
        activeToolCallsRef.current.set(event.execution_id, { 
          name: event.name, 
          arguments: event.arguments 
        });
        
        const toolMessage = getToolCallMessage(event.name);
        if (toolMessage) {
          
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
        
        // Handle allergy and dietary needs updates
        // Use the stored tool call arguments (not the result, which is just a confirmation string)
        if (event.name === 'add_allergies' || event.name === 'remove_allergies' ||
            event.name === 'add_dietary_needs' || event.name === 'remove_dietary_needs') {
          
          // Get the stored tool call to access the original arguments
          const storedToolCall = activeToolCallsRef.current.get(event.execution_id);
          if (storedToolCall) {
            try {
              // Arguments come as a JSON string from VAPI, need to parse them
              const args = typeof storedToolCall.arguments === 'string'
                ? JSON.parse(storedToolCall.arguments)
                : storedToolCall.arguments;
              
              const currentUser = userRef.current;
                if (currentUser) {
                if (event.name === 'add_allergies') {
                  const items = args.allergies || [];
                  const currentAllergies = currentUser.allergies || [];
                  const newAllergies = [...new Set([...currentAllergies, ...items])];
                  updateUserRef.current({ allergies: newAllergies });
                } else if (event.name === 'remove_allergies') {
                  const items = args.allergies || [];
                  const currentAllergies = currentUser.allergies || [];
                  const newAllergies = currentAllergies.filter(a => !items.includes(a));
                  updateUserRef.current({ allergies: newAllergies });
                } else if (event.name === 'add_dietary_needs') {
                  const items = args.dietary_needs || [];
                  const currentDietaryNeeds = currentUser.dietary_needs || [];
                  const newDietaryNeeds = [...new Set([...currentDietaryNeeds, ...items])];
                  updateUserRef.current({ dietary_needs: newDietaryNeeds });
                } else if (event.name === 'remove_dietary_needs') {
                  const items = args.dietary_needs || [];
                  const currentDietaryNeeds = currentUser.dietary_needs || [];
                  const newDietaryNeeds = currentDietaryNeeds.filter(d => !items.includes(d));
                  updateUserRef.current({ dietary_needs: newDietaryNeeds });
                }
              }
            } catch (e) {
              console.error('Failed to parse tool call arguments:', e);
            }
          } else {
            console.warn('No stored tool call found for execution_id:', event.execution_id);
          }
        }
        
        // Remove the tool call from active tracking
        activeToolCallsRef.current.delete(event.execution_id);
        
        // The actual result will be delivered via MODEL_OUTPUT and ASSISTANT_SPEAKING events
        // We need to replace the shimmer message with the actual content when it arrives
        break;
        
      default:
        break;
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
   * Subscribe to connection status changes on mount
   */
  useEffect(() => {
    // Set initial connection status
    setIsVoiceControllerConnected(voiceControllerService.isConnected());
    
    // Subscribe to connection status changes
    const unsubscribe = voiceControllerService.onConnectionChange((connected) => {
      setIsVoiceControllerConnected(connected);
    });
    
    return () => unsubscribe();
  }, []);

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
    // Only send last 5 messages to keep context manageable
    const formattedMessages = messages.length > 0 
      ? messages.slice(-5).map(msg => {
          let content = msg.content;
          
          // If this message includes tool call data, append it to the content
          if (msg.toolCallData) {
            if (msg.toolCallData.name === 'get_product_location') {
              content += `\n[Tool: get_product_location, Result: ${JSON.stringify(msg.toolCallData.productLocation)}]`;
            } else if (msg.toolCallData.name === 'get_ai_alternatives') {
              content += `\n[Tool: get_ai_alternatives, Alternatives: ${JSON.stringify(msg.toolCallData.alternatives)}, Explanation: ${msg.toolCallData.explanation}]`;
            }
          }
          
          return {
            role: msg.type, // 'user' or 'assistant'
            content: content,
          };
        })
      : [];

    // Start the call with variables and previous messages
    voiceControllerService.startCall(variables, formattedMessages);
  }, [user, messages, cartItems]);

  /**
   * Stop the current voice conversation
   */
  const stopConversation = useCallback(() => {
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
   * Play a pre-made audio through the voice controller
   * @param {string} audioName - Name of the audio file (without extension)
   */
  const playAudio = useCallback((audioName) => {
    if (voiceControllerService.isConnected()) {
      voiceControllerService.playAudio(audioName);
    } else {
      console.warn('Cannot play audio: Voice controller not connected');
    }
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
    
    // Play conflict warning audio
    if (voiceControllerService.isConnected()) {
      voiceControllerService.playAudio('warning');
    }
  }, []);

  const value = {
    // State
    isConversationActive,
    chatStatus,
    timerProgress,
    messages,
    highlightedProductId,
    isVoiceControllerConnected,
    showPolicyViolationModal,
    showUnexpectedEndModal,
    
    // Actions
    toggleConversation,
    startConversation,
    stopConversation,
    clearMessages,
    addMessage,
    addConflictMessage,
    playAudio,
    setShowPolicyViolationModal,
    setShowUnexpectedEndModal,
    
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

