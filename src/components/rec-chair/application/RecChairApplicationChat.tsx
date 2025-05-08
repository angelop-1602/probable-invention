"use client";

import { useState, useEffect } from "react";
import { Application } from "@/types/rec-chair";
import { ChatUI } from "@/components/shared/messaging/ChatUI";
import { MessagingProvider, PROTOCOL_REVIEW_APPLICATIONS_PATH } from "@/lib/messaging/messaging-context";
import { useAuthContext } from "@/lib/auth/auth-context";
import { showErrorToast } from "@/lib/ui/toast-utils";

interface RecChairApplicationChatProps {
  application: Application;
}

export function RecChairApplicationChat({ application }: RecChairApplicationChatProps) {
  const [applicationCode, setApplicationCode] = useState<string>("");
  const { user } = useAuthContext();
  
  // Extract the application code on mount for consistency
  useEffect(() => {
    // Always prefer applicationCode
    const code = application?.applicationCode || application?.recCode || application?.spupRecCode || application?.id || '';
    if (code) {
      setApplicationCode(code);
    } else {
      showErrorToast("Chat Error", "Unable to load chat - missing application code");
    }
  }, [application]);

  if (!applicationCode) {
    return <div className="text-center p-4">No application code available for chat.</div>;
  }

  // Ensure the REC chair user is authenticated
  if (!user?.uid) {
    return <div className="text-center p-4">You must be signed in to use the chat.</div>;
  }

  return (
    <MessagingProvider 
      applicationCode={applicationCode} 
      collectionPath={PROTOCOL_REVIEW_APPLICATIONS_PATH}
      proponentMode={false}
    >
      <ChatUI 
        title="Proponent Communication" 
        description="This is the communication between the proponent and the REC Chair."
        emptyStateMessage="No messages yet. Start the conversation with the proponent."
        isProponentMode={false}
      />
    </MessagingProvider>
  );
} 