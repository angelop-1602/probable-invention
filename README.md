# Protocol Review Application System

## Messaging System

The system uses a real-time messaging system to enable communication between proponents and REC chairs.

### Structure

- Messages are stored in Firestore as a subcollection `messages` under each protocol review application document
- Path: `protocolReviewApplications/{applicationId}/messages/{messageId}`
- The `applicationId` is normalized using the `normalizeApplicationId` function to ensure consistency

### Important Notes on Application IDs

Application IDs are handled in multiple ways:

1. **REC Codes**: The preferred format is `REC{YEAR}{6-CHAR-CODE}` (e.g., `REC2023ABCDEF`)
2. **Database IDs**: Some applications may use Firestore-generated document IDs
3. **Normalized IDs**: All IDs are normalized before use in the messaging system to ensure consistency

The system now uses improved ID normalization that:
- Preserves official REC code format 
- Standardizes other types of IDs by removing special characters
- Enhances error logging and debugging

### Debugging Tools

The system includes utilities for debugging messaging issues:

- `checkMessagesCollectionExists`: Verifies if messages exist for an application
- `findMessagesCollections`: Searches for message collections across multiple possible IDs
- `debugMessagingForApplication`: Generates comprehensive debugging information
- `migrateMessages`: Can transfer messages between different application IDs if needed

### Components

- `MessagingProvider`: Context provider for messaging capabilities
- `ChatUI`: Reusable chat interface for both proponents and REC chairs
- `ProponentApplicationChat`: Chat component for proponents
- `RecChairApplicationChat`: Chat component for REC chairs

Both components use the same collection path (`protocolReviewApplications`) but may have different views of the messages based on the user's role. 