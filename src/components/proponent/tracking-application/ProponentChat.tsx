"use client";

import { useState, useEffect } from "react";
import { Application } from "@/types/protocol-application/tracking";
import { ChatUI } from "@/components/shared/messaging/ChatUI";
import { MessagingProvider, PROTOCOL_REVIEW_APPLICATIONS_PATH } from "@/lib/messaging/messaging-context";
import { showErrorToast } from "@/lib/ui/toast-utils";

interface ProponentChatProps {
  application: Application;
}

/**
 * A specialized chat component for proponents that forces proponent mode
 */
export const ProponentChat = ({ application }: ProponentChatProps) => {
  const [applicationCode, setApplicationCode] = useState<string>("");
  
  // Extract the application ID on mount
  useEffect(() => {
    // Always prefer applicationCode
    const code = application?.applicationCode || application?.spupRecCode || '';
    if (code) {
      setApplicationCode(code);
    } else {
      showErrorToast("Chat Error", "Unable to load chat - missing application code");
    }
  }, [application]);

  if (!applicationCode) {
    return (
      <div className="p-4 border rounded-md bg-muted">
        <p className="text-center">Unable to load chat - missing application code</p>
      </div>
    );
  }

  return (
    <MessagingProvider 
      applicationCode={applicationCode}
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