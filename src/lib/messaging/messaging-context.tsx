"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Message, 
  subscribeToMessages, 
  sendMessage as sendMessageUtil, 
  markMessagesAsRead as markMessagesAsReadUtil,
  getCachedMessages,
  checkApplicationDocument
} from '@/lib/messaging';
import { useAuthContext } from '@/lib/auth/auth-context';

// Collection path constants
export const PROTOCOL_REVIEW_APPLICATIONS_PATH = "protocolReviewApplications";

export interface MessagingContextProps {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  sendMessage: (text: string, senderDetails?: { name?: string; role?: string }) => Promise<boolean>;
  unreadCount: number;
  applicationContext?: {
    applicationCode: string;
    collectionPath: string;
  };
}

const MessagingContext = createContext<MessagingContextProps | undefined>(undefined);

export interface MessagingProviderProps {
  children: ReactNode;
  applicationCode: string;
  collectionPath: string;
  proponentMode?: boolean;  // Flag to indicate if being used in proponent context
  proponentName?: string;   // Optional proponent name for unauthenticated users
  debug?: boolean;
}

// Safe version of useAuthContext that won't throw errors if no provider
const useSafeAuthContext = (proponentMode: boolean) => {
  try {
    return useAuthContext();
  } catch (error) {
    // If we're in proponent mode, return a dummy auth context
    if (proponentMode) {
      return { user: null };
    }
    // Otherwise, re-throw the error
    throw error;
  }
};

export const MessagingProvider: React.FC<MessagingProviderProps> = ({ 
  children, 
  applicationCode,
  collectionPath,
  proponentMode = false,
  proponentName,
  debug = false
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSafeAuthContext(proponentMode);
  
  // Check if application document exists
  useEffect(() => {
    if (!applicationCode) {
      setError("Missing application code");
      return;
    }

    const checkDocument = async () => {
      const result = await checkApplicationDocument(applicationCode, collectionPath);
      if (!result.exists) {
        setError(`Application document ${applicationCode} not found. Messages won't work.`);
      }
    };

    checkDocument();
  }, [applicationCode, collectionPath]);
  
  // Load initially from cache if available
  useEffect(() => {
    if (applicationCode) {
      const cachedMessages = getCachedMessages(applicationCode);
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
        setIsLoading(false);
      }
    }
  }, [applicationCode]);

  // Fetch messages from Firebase
  useEffect(() => {
    if (!applicationCode) return;
    
    setIsLoading(true);
    
    // Subscribe to messages with real-time updates
    const unsubscribe = subscribeToMessages(
      applicationCode,
      collectionPath,
      (fetchedMessages) => {
        setMessages(fetchedMessages);
        setIsLoading(false);
        
        // Mark messages as read
        if (proponentMode) {
          // For proponents, use a generated ID and the proponent flag
          const proponentId = `proponent-${applicationCode}`;
          markMessagesAsReadUtil(applicationCode, collectionPath, proponentId, fetchedMessages, true);
          
          // Count unread messages from non-proponents
          const unreadMessages = fetchedMessages.filter(
            msg => !msg.read && !msg.senderId.startsWith('proponent-')
          );
          setUnreadCount(unreadMessages.length);
        } else if (user?.uid) {
          // For REC chair, use their auth ID
          markMessagesAsReadUtil(applicationCode, collectionPath, user.uid, fetchedMessages, false);
          
          // Count unread messages from proponents
          const unreadMessages = fetchedMessages.filter(
            msg => !msg.read && msg.senderId.startsWith('proponent-')
          );
          setUnreadCount(unreadMessages.length);
        }
      }
    );
    
    // Clean up subscription
    return () => {
      unsubscribe();
    };
  }, [applicationCode, collectionPath, user?.uid, proponentMode]);

  // Send a message
  const sendMessage = async (text: string, senderDetails?: { name?: string; role?: string }): Promise<boolean> => {
    if (!applicationCode || !text.trim()) return false;
    
    setIsSending(true);
    
    try {
      // IMPORTANT: If we're in proponent mode, don't require authentication
      if (proponentMode === true) {
        // Always prioritize provided name or use default proponent name
        const proponentDetails = {
          name: senderDetails?.name || proponentName || "Proponent",
          role: senderDetails?.role || "Proponent"
        };
        
        // Use application code as the sender ID for proponents
        const senderId = `proponent-${applicationCode}`;
        
        const result = await sendMessageUtil(
          applicationCode,
          collectionPath,
          text.trim(),
          senderId,
          proponentDetails
        );
        
        return result;
      } 
      
      // For REC chair mode - require authentication
      if (!user?.uid) {
        return false;
      }
      
      // Create REC Chair specific details
      const recChairDetails = senderDetails || {
        name: "REC Chair",
        role: "REC Chair"
      };
      
      return await sendMessageUtil(
        applicationCode,
        collectionPath,
        text.trim(),
        user.uid,
        recChairDetails
      );
    } catch (error) {
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const value = {
    messages,
    isLoading,
    isSending,
    sendMessage,
    unreadCount,
    applicationContext: {
      applicationCode,
      collectionPath
    }
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = (): MessagingContextProps => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}; 