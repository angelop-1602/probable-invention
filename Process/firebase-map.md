/protocolReviewApplications/{applicationID}
  applicationCode: string                // e.g. "REC2025AJJH79"
  applicationStatus: string              // e.g. "pending", "under_review", "accepted", "completed", "resubmission", "archived"
  createdAt: timestamp                   // Firestore Timestamp
  updatedAt: timestamp                   // Firestore Timestamp
  decision: string                       // e.g. "approved", "disapproved", "minor_revision", "major_revision", "pending"
  funding: string                        // e.g. "None", "University Grant", "External Sponsor"
  hasMessages: boolean                   // true or false
  lastMessageAt: timestamp               // Firestore Timestamp
  progress: string                       // e.g. "IR", "SR", "Completed", "Initial", "Submitted", "Accepted", "Resubmission"
  progressDetails: string                // e.g. "Waiting for reviewer", "PI to resubmit"
  submittedBy: string                    // e.g. "user@example.com" or user UID
  currentTab: string                     // e.g. "Initial", "Submitted", "Accepted", "Completed", "Resubmission", "All"
  archived: boolean                      // true or false

  proponent:
    advisor: string                      // e.g. "Dr. Jane Doe"
    courseProgram: string                // e.g. "BS Biology"
    email: string                        // e.g. "student@example.com"
    name: string                         // e.g. "John Smith"
    submissionDate: timestamp            // Firestore Timestamp

  protocolDetails:
    researchTitle: string                // e.g. "Community Governance Modernization in Zhuhai City"
    recCode: string                      // e.g. "SPUP_2025_0001_SR_ZX"
    researchType: string                 // e.g. "(SR) Social Research", "(BR) Biomedical Research"

  reviewProgress:
    submissionCheck: string              // e.g. "complete", "incomplete"
    reviewType: string                   // e.g. "expedited", "full", "exempt"
    status: string                       // e.g. "pending", "under_review", "accepted", "completed"
    updatedAt: timestamp                 // Firestore Timestamp

  documents: [
    {
  documentType: string            // e.g. "consent", "protocol", "exemption"
  title: string                   // e.g. "Informed Consent"
  fileName: string                // e.g. "consent_form_2024.pdf"
  status: "accepted" | "rejected" | "pending" | "revision_submitted"
  storagePath: string             // Firebase Storage path
  uploadDate: Timestamp           // Firestore timestamp
  version: number                 // numeric versioning
  comments?: string  
    }
  ]

  // subcollections:
    /messages/{messageID}
      read: boolean                      // true or false
      senderId: string                   // e.g. "userUID123"
      senderName: string                 // e.g. "Dr. Jane Doe"
      senderRole: string                 // e.g. "proponent", "reviewer", "chair"
      text: string                       // e.g. "Please see my comments."
      timestamp: timestamp               // Firestore Timestamp
      isRead: boolean                    // true or false

    /primaryReviewers/{reviewerCode}
      assignDate: timestamp              // Firestore Timestamp
      code: string                       // e.g. "DRJF-018"
      id: string                         // Reviewer UID
      name: string                       // e.g. "Dr. Janette Fermin"
      reviewForm: string                 // e.g. "Form 06A", "Form 06C", "Form 06B", "Form 04A"
      status: string                     // e.g. "Assigned", "In Progress", "Completed", "Accepted", "Resubmission"
      formSubmissionStatus: string       // e.g. "not_started", "in_progress", "submitted", "accepted", "completed", "needs_resubmission"
      formSubmissionDate: timestamp      // Firestore Timestamp
      lastEditedAt: timestamp            // Firestore Timestamp
      editable: boolean                  // true or false
      reviewerEmail: string              // e.g. "janette.fermin@example.com"
      notes: string                      // e.g. "Needs to review consent section"

/reviewers/{reviewerId}
  code: string                           // e.g. "DRJF-018"
  name: string                           // e.g. "Dr. Janette Fermin"
  email: string                          // e.g. "janette.fermin@example.com"
  department: string                     // e.g. "Biology"
  isActive: boolean                      // true or false
  createdAt: timestamp                   // Firestore Timestamp
  updatedAt: timestamp                   // Firestore Timestamp
  roles: [string]                        // e.g. ["primary", "chair"]
