"use client";

import { useState, useEffect } from "react";
import { Application } from "@/types/protocol-application/tracking";
import { ChatUI } from "@/components/shared/messaging/ChatUI";
import { MessagingProvider, PROTOCOL_REVIEW_APPLICATIONS_PATH } from "@/lib/messaging/messaging-context";
import { showErrorToast } from "@/lib/ui/toast-utils";

interface ApplicationChatProps {
  application: Application;
}

export const ApplicationChat = ({ application }: ApplicationChatProps) => {
  const [applicationId, setApplicationId] = useState<string>("");
  
  // Extract the application ID on mount for consistency
  useEffect(() => {
    // Try various properties that might contain the ID
    const id = application?.applicationCode || 
               application?.spupRecCode || 
               '';

    if (id) {
      setApplicationId(id);
    } else {
      showErrorToast("Chat Error", "Unable to load chat - missing application ID");
    }
  }, [application]);

  if (!applicationId) {
    return (
      <div className="text-center p-4">
        <p>No application ID available for chat.</p>
      </div>
    );
  }

  return (
    <MessagingProvider 
      applicationCode={applicationId} 
      collectionPath={PROTOCOL_REVIEW_APPLICATIONS_PATH}
      proponentMode={true}
      proponentName={application.principalInvestigator || "Proponent"}
    >
      <ChatUI 
        title="Application Chat" 
        emptyStateMessage="No messages yet. Start the conversation with the REC Chair."
        isProponentMode={true}
      />
    </MessagingProvider>
  );
}; 