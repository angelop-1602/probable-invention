"use client";

import { useState, useEffect } from "react";
import { ChatUI } from "@/components/shared/messaging/ChatUI";
import { MessagingProvider, PROTOCOL_REVIEW_APPLICATIONS_PATH } from "@/lib/messaging/messaging-context";
import { normalizeApplicationId, checkMessagesCollectionExists } from "@/lib/messaging";
import { useToast } from "@/components/ui/use-toast";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Helper function to prevent accidental rendering of toast returns
function showErrorToast(toast: any, title: string, description: string) {
  toast({
    title,
    description,
    variant: "destructive",
  });
}

interface ProponentApplicationChatProps {
  applicationId: string; // This should be the application code or ID
  proponentName?: string; // Optional proponent name
  proponentEmail?: string; // Optional proponent email
}

export function ProponentApplicationChat({ 
  applicationId: rawApplicationId,
  proponentName = "Proponent",
  proponentEmail
}: ProponentApplicationChatProps) {
  const [applicationCode, setApplicationCode] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  const { toast } = useToast();
  
  // Normalize the application ID for consistent Firebase paths
  useEffect(() => {
    if (!rawApplicationId) {
      showErrorToast(toast, "Chat Error", "Unable to load chat - missing application ID");
      return;
    }
    
    const normalizedId = normalizeApplicationId(rawApplicationId);
    setApplicationCode(normalizedId);
    
    // Ensure the document exists in Firestore
    async function ensureDocumentExists() {
      try {
        // Check if messages collection exists
        const exists = await checkMessagesCollectionExists(normalizedId);
        
        if (!exists) {
          // Create the parent document if it doesn't exist
          await setDoc(doc(db, PROTOCOL_REVIEW_APPLICATIONS_PATH, normalizedId), {
            lastUpdated: serverTimestamp(),
            chatEnabled: true,
            proponentMode: true,
            proponentName: proponentName,
            proponentEmail: proponentEmail
          }, { merge: true });
        }
        
        setIsReady(true);
      } catch (error) {
        showErrorToast(toast, "Chat Setup Error", "Unable to initialize chat. Please try again later.");
      }
    }
    
    ensureDocumentExists();
  }, [rawApplicationId, proponentName, proponentEmail, toast]);

  if (!applicationCode || !isReady) {
    return <div className="text-center p-4">Setting up chat communication. Please wait...</div>;
  }

  // Construct a full name for the proponent if email is available
  const fullProponentName = proponentEmail ? 
    `${proponentName} (${proponentEmail})` : 
    proponentName;

  return (
    <MessagingProvider 
      applicationCode={applicationCode} 
      collectionPath={PROTOCOL_REVIEW_APPLICATIONS_PATH}
      proponentMode={true}
      proponentName={fullProponentName}
    >
      <ChatUI 
        title="REC Communication" 
        emptyStateMessage="No messages yet. Start the conversation with the REC Chair."
        isProponentMode={true}
      />
    </MessagingProvider>
  );
} 