# Firebase Protocol Review Application Implementation

This document outlines the implementation of the Firebase database structure for the Protocol Review Application system.

## Database Structure

The system uses Firestore as its database with the following collections:

### Collection: protocolReviewApplications

```
/protocolReviewApplications/{applicationId} (document)
  Fields:
    applicationCode              (string)
    spupRecCode                  (string)
    applicationStatus            (string)
    createdAt                    (timestamp)
    updatedAt                    (timestamp)

    principalInvestigator        (string)
    adviser                      (string)
    courseProgram                (string)
    fundingType                  (string)    # "Researcher-funded" | "Institution-funded" | "Agency-funded" | "Pharmaceutical-funded" | "Other"
    researchType                 (string)    # "Experimental" | "Social/Behavioral"

    protocolDetails:
      researchTitle              (string)

    proponent:
      name                       (string)
      email                      (string)
      advisor                    (string)
      courseProgram              (string)
      submissionDate             (timestamp)

    notificationPreferences:
      email                      (boolean)
      sms                        (boolean)

    lastNotifiedAt               (timestamp)
    faqAcknowledged              (boolean)

    # Embedded arrays/objects
    resubmissions:               (array of objects)
      - version                  (string)
        submittedDate            (timestamp)
        documents                (array<string>)    # list of document IDs
        reviewDecision           (string)            # "Approved" | "Minor Revisions" | "Major Revisions" | "Rejected"
        decisionDate             (timestamp)

    progressReports:             (array of objects)
      - reportDate               (timestamp)
        formUrl                  (string)

    finalReport:                 (map)
      submittedDate              (timestamp)
      formUrl                    (string)

    archiving:                   (map)
      date                       (timestamp)
      notificationUrl            (string)

    termination:                 (map)
      date                       (timestamp)
      reason                     (string)
      formUrl                    (string)
```

### Subcollections

```
  1. primary-reviewers  
     /primary-reviewers/{reviewerId} (document)
       reviewerCode             (string)
       reviewerName             (string)
       formType                 (string)    # "protocolReview" | "informedConsent" | …
       assignedDate             (timestamp)
       submissionDate           (timestamp)
       completedDate            (timestamp)
       status                   (string)    # "Pending" | "In-progress" | "Completed"
       decision                 (string)    # "Approved" | "Minor Revisions" | …
       comments                 (string)
       answers                  (map)       # { questionId: answerString, … }
       formVersion              (string)

  2. documents  
     /documents/{docId} (document)
       displayName            (string)
       documentName           (string)
       documentType           (string)
       fileName               (string)
       originalFilenames      (map)
         [zipFileName]:
           [originalPdfName]: (string)
       size                   (number)
       status                 (string)
       storagePath            (string)
       title                  (string)
       uploadDate             (timestamp)
       version                (string)
       acceptedByChair        (boolean)
       acceptanceDate         (timestamp)
       requestedByChair       (boolean)
       chairRemarks           (string)
```

## Implementation Details

### Type Definitions

The system uses TypeScript interfaces to enforce the database structure:

- `ApplicationFormData`: Base application form data
- `ExtendedApplicationFormData`: Application form data with co-researchers
- `DocumentFiles`: Document files structure
- `SubmissionResult`: Result of application submission

### Services

The system uses service classes to interact with Firebase:

- `ApplicationService`: Handles application operations
- `DocumentService`: Handles document operations
- `StorageService`: Handles file storage operations

### Hooks

Custom React hooks are provided for components to interact with the services:

- `useEnhancedApplicationData`: Main hook for application operations
- `useDocumentTracking`: Hook for tracking document status
- `useDocumentApproval`: Hook for document approval operations

## Best Practices Implemented

1. **Data Transformation**: Form data is transformed to match the Firebase structure
2. **Type Safety**: Strong TypeScript typing throughout
3. **Error Handling**: Comprehensive error handling for all operations
4. **Singleton Pattern**: Services follow singleton pattern
5. **Caching**: Implementation includes caching for performance
6. **Separation of Concerns**: Clear separation between data, UI, and business logic

## Usage Examples

### Submitting an Application

```typescript
const { submitApplication } = useApplicationData();

// Form data following the Firebase structure
const formData = {
  principalInvestigator: "John Doe",
  adviser: "Dr. Smith",
  courseProgram: "BSCS",
  protocolDetails: {
    researchTitle: "Example Research Title"
  },
  proponent: {
    name: "John Doe",
    email: "john@example.com",
    advisor: "Dr. Smith", 
    courseProgram: "BSCS"
  },
  // ... other fields
};

// Document files
const documentFiles = {
  form07A: [file1],
  form07B: [file2],
  // ... other documents
};

// Submit application
try {
  const result = await submitApplication(formData, documentFiles);
  console.log("Application submitted successfully:", result.applicationCode);
} catch (error) {
  console.error("Error submitting application:", error);
}
```

### Fetching Application Data

```typescript
const { application, isLoading, error } = useApplicationData("APP12345");

if (isLoading) {
  return <div>Loading...</div>;
}

if (error) {
  return <div>Error: {error}</div>;
}

return (
  <div>
    <h1>{application.protocolDetails.researchTitle}</h1>
    <p>Investigator: {application.principalInvestigator}</p>
    {/* ... other fields */}
  </div>
);
``` 