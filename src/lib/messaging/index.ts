import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  where,
  DocumentReference,
  Timestamp,
  writeBatch,
  setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Message interface
export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  timestamp: any; // Firestore timestamp
  read: boolean;
}

// MessageCache to store messages per application
const messageCache: Record<string, Message[]> = {};

/**
 * Normalize application ID to ensure consistency
 * This helps when different components might use different ID references
 * @param applicationId The application ID to normalize
 * @returns Normalized application ID
 */
export function normalizeApplicationId(applicationId: string): string {
  // Check if already normalized
  if (!applicationId) return '';
  
  // Handle different possible ID formats
  let normalizedId = applicationId.trim();
  
  // If it's a REC code format (REC followed by digits and letters), preserve it exactly in uppercase
  if (/^REC\d{4}[A-Z0-9]+$/i.test(normalizedId)) {
    // Ensure uppercase for consistency
    return normalizedId.toUpperCase();
  }
  
  // If it's a SPUP code format, normalize consistently
  if (/^SPUP_\d{4}_\d{4}/i.test(normalizedId)) {
    // Convert to lowercase, remove spaces, and ensure consistent formatting
    return normalizedId.toLowerCase().replace(/\s+/g, '');
  }
  
  // For other formats, remove spaces, special characters and standardize
  return normalizedId
    .replace(/\s+/g, '')  // Remove spaces
    .replace(/[^\w-]/g, '') // Remove special chars except alphanumeric and dash
    .toLowerCase();  // Convert to lowercase for consistency
}

/**
 * Find all messages for a specific application
 * Useful for debugging message storage issues
 * @param collectionPath Base collection path for applications
 * @returns Array of application IDs and their message counts
 */
export async function findAllApplicationMessages(collectionPath: string) {
  try {
    const applicationsRef = collection(db, collectionPath);
    const applicationsSnapshot = await getDocs(applicationsRef);
    
    const results: Array<{id: string, messageCount: number}> = [];
    
    for (const appDoc of applicationsSnapshot.docs) {
      const applicationId = appDoc.id;
      const messagesRef = collection(db, `${collectionPath}/${applicationId}/messages`);
      const messagesSnapshot = await getDocs(messagesRef);
      
      results.push({
        id: applicationId,
        messageCount: messagesSnapshot.size
      });
    }
    
    return results;
  } catch (error) {
    console.error("Error finding all application messages:", error);
    return [];
  }
}

/**
 * Get possible ID formats to try when searching for a document
 * This helps handle differences in how IDs might be stored
 * @param applicationId The original application ID
 * @returns Array of possible formats to try
 */
function getPossibleIdFormats(applicationId: string): string[] {
  if (!applicationId) return [];
  
  const formats = [
    applicationId, // Original format, exactly as provided
  ];
  
  // For REC codes, always add uppercase version
  if (applicationId.toUpperCase().startsWith('REC')) {
    formats.push(applicationId.toUpperCase());
  }
  
  // For SPUP codes, try various formats
  if (applicationId.toUpperCase().startsWith('SPUP')) {
    // Uppercase version
    formats.push(applicationId.toUpperCase());
    
    // Lowercase with underscores (spup_2025_0001_sr_zx)
    formats.push(applicationId.toLowerCase());
    
    // Lowercase without separators (spup202500001srzx)
    formats.push(applicationId.toLowerCase().replace(/[_\s-]/g, ''));
    
    // Original with consistent separators
    formats.push(applicationId.replace(/[\s-]/g, '_'));
  }
  
  // Remove duplicates
  return [...new Set(formats)];
}

/**
 * Find the parent document for an application ID
 * @param collectionPath Collection path to search in
 * @param applicationId Application ID to find
 * @returns The document reference if found, or null if not found
 */
async function findParentDocument(
  collectionPath: string,
  applicationId: string
): Promise<DocumentReference | null> {
  if (!applicationId || !collectionPath) return null;
  
  // Get all possible formats to try
  const possibleFormats = getPossibleIdFormats(applicationId);
  console.log(`Searching for parent document with possible formats:`, possibleFormats);
  
  // Try each format
  for (const format of possibleFormats) {
    const docRef = doc(db, collectionPath, format);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log(`Found document with format: ${format}`);
      return docRef;
    }
  }
  
  // Also look for documents where applicationCode matches
  try {
    const appQuery = query(
      collection(db, collectionPath),
      where('applicationCode', '==', applicationId)
    );
    const querySnap = await getDocs(appQuery);
    
    if (!querySnap.empty) {
      const docRef = querySnap.docs[0].ref;
      console.log(`Found document by applicationCode query: ${docRef.id}`);
      return docRef;
    }
  } catch (error) {
    console.warn(`Error querying by applicationCode:`, error);
  }
  
  console.error(`Could not find document for application ID: ${applicationId}`);
  return null;
}

/**
 * Subscribe to messages for a specific application
 * @param applicationCode Application code (REC code) to subscribe to messages for
 * @param collectionPath Base collection path for messages
 * @param onMessagesUpdate Callback function for when messages are updated
 * @returns Function to unsubscribe from messages
 */
export function subscribeToMessages(
  applicationCode: string,
  collectionPath: string,
  onMessagesUpdate: (messages: Message[]) => void
) {
  if (!applicationCode) {
    console.error("Missing applicationCode in subscribeToMessages");
    onMessagesUpdate([]);
    return () => {};
  }
  
  console.log(`Subscribing to messages for ${applicationCode}`);
  
  // Create a reference to the messages subcollection
  const messagesRef = collection(db, `${collectionPath}/${applicationCode}/messages`);
  const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));
  
  // Subscribe to real-time updates
  const unsubscribe = onSnapshot(
    messagesQuery, 
    (snapshot) => {
      const fetchedMessages: Message[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMessages.push({
          id: doc.id,
          text: data.text || "",
          senderId: data.senderId || "",
          senderName: data.senderName || "Unknown",
          senderRole: data.senderRole || "",
          timestamp: data.timestamp || { toDate: () => new Date() },
          read: data.read || false
        });
      });
      
      // Update cache
      messageCache[applicationCode] = fetchedMessages;
      
      // Call callback
      onMessagesUpdate(fetchedMessages);
      console.log(`Received ${fetchedMessages.length} messages for ${applicationCode}`);
    },
    (error) => {
      console.error(`Error getting messages for ${applicationCode}:`, error);
      onMessagesUpdate([]);
    }
  );
  
  return unsubscribe;
}

/**
 * Send a message for a specific application
 * @param applicationCode Application code (REC code) to send message for
 * @param collectionPath Base collection path for messages
 * @param message Message text to send
 * @param userId Current user ID or proponent identifier
 * @param senderDetails Optional sender details for unauthenticated users
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function sendMessage(
  applicationCode: string,
  collectionPath: string,
  message: string,
  userId: string,
  senderDetails?: { name?: string; role?: string; }
): Promise<boolean> {
  if (!message.trim() || !userId || !applicationCode) {
    console.error("Missing required parameters in sendMessage");
    return false;
  }
  
  console.log(`Attempting to send message for application: ${applicationCode}`);
  
  try {
    // Check if the parent document exists
    const docRef = doc(db, collectionPath, applicationCode);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.error(`Document not found: ${collectionPath}/${applicationCode}`);
      return false;
    }
    
    // Update the parent document to indicate it has messages
    await updateDoc(docRef, {
      hasMessages: true,
      lastMessageAt: serverTimestamp()
    });
    
    // Determine sender details
    let senderName = "User";
    let senderRole = "Proponent";
    
    if (senderDetails) {
      // Use provided details
      senderName = senderDetails.name || senderName;
      senderRole = senderDetails.role || senderRole;
    } else {
      // Try to get user details if not provided
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        const userData = userDoc.data();
        if (userData) {
          senderName = userData?.displayName || userData?.email || senderName;
          senderRole = userData?.role || senderRole;
        }
      } catch (error) {
        console.warn(`Could not fetch user details, using defaults`);
      }
    }
    
    // Create messages subcollection reference
    const messagesRef = collection(db, `${collectionPath}/${applicationCode}/messages`);
    
    // Add the message
    const messageDoc = await addDoc(messagesRef, {
      text: message.trim(),
      senderId: userId,
      senderName,
      senderRole,
      timestamp: serverTimestamp(),
      read: false
    });
    
    console.log(`Successfully added message: ${messageDoc.id} to ${collectionPath}/${applicationCode}/messages`);
    return true;
  } catch (error) {
    console.error(`Error sending message:`, error);
    return false;
  }
}

/**
 * Mark messages as read for a specific application
 * @param applicationCode Application code to mark messages as read for
 * @param collectionPath Base collection path for messages
 * @param userId Current user ID or proponent identifier
 * @param messages Array of messages to check
 * @param isProponent Optional flag to indicate if this is a proponent user
 */
export async function markMessagesAsRead(
  applicationCode: string,
  collectionPath: string,
  userId: string,
  messages: Message[],
  isProponent: boolean = false
): Promise<void> {
  if (!userId || !applicationCode || !messages.length) return;

  try {
    // Determine which messages to mark as read
    let unreadMessages: Message[];
    
    if (isProponent) {
      // For proponents, mark messages that aren't from any proponent
      unreadMessages = messages.filter(
        msg => !msg.read && !msg.senderId.startsWith('proponent-')
      );
    } else {
      // For REC chair, mark messages from proponents
      unreadMessages = messages.filter(
        msg => !msg.read && msg.senderId.startsWith('proponent-')
      );
    }
    
    if (!unreadMessages.length) return;
    
    // Mark each unread message as read
    for (const message of unreadMessages) {
      const messageRef = doc(db, `${collectionPath}/${applicationCode}/messages`, message.id);
      await updateDoc(messageRef, { read: true });
    }
  } catch (error) {
    console.error(`Error marking messages as read:`, error);
  }
}

/**
 * Get cached messages for a specific application
 */
export function getCachedMessages(applicationCode: string): Message[] {
  if (!applicationCode) return [];
  return messageCache[applicationCode] || [];
}

/**
 * Check if document exists and if messages subcollection exists
 */
export async function checkApplicationDocument(
  applicationCode: string,
  collectionPath: string = "protocolReviewApplications"
): Promise<{exists: boolean, hasMessages: boolean, messageCount: number}> {
  try {
    // Check if document exists
    const docRef = doc(db, collectionPath, applicationCode);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {exists: false, hasMessages: false, messageCount: 0};
    }
    
    // Check if messages subcollection exists
    const messagesRef = collection(db, `${collectionPath}/${applicationCode}/messages`);
    const messagesSnap = await getDocs(messagesRef);
    
    return {
      exists: true,
      hasMessages: !messagesSnap.empty,
      messageCount: messagesSnap.size
    };
  } catch (error) {
    console.error(`Error checking application document:`, error);
    return {exists: false, hasMessages: false, messageCount: 0};
  }
}

/**
 * Debug utility: Check if a messages collection exists
 */
export async function checkMessagesCollectionExists(
  applicationId: string,
  collectionPath: string = "protocolReviewApplications"
): Promise<boolean> {
  try {
    const parentDocRef = await findParentDocument(collectionPath, applicationId);
    if (!parentDocRef) return false;
    
    const messagesRef = collection(parentDocRef, 'messages');
    const messagesSnap = await getDocs(messagesRef);
    
    return !messagesSnap.empty;
  } catch (error) {
    console.error(`Error checking messages collection:`, error);
    return false;
  }
}

/**
 * Debug utility: Find all possible messages collections for an application ID
 * This is useful for finding mismatched message collections
 * @param possibleIds Array of possible application IDs to check
 * @param collectionPath Base collection path
 * @returns Promise resolving to an array of valid locations
 */
export async function findMessagesCollections(
  possibleIds: string[],
  collectionPath: string = "protocolReviewApplications"
): Promise<Array<{id: string, normalizedId: string, exists: boolean, messageCount: number}>> {
  const results = [];
  
  for (const id of possibleIds) {
    if (!id) continue;
    
    try {
      const normalizedId = normalizeApplicationId(id);
      const messagesRef = collection(db, `${collectionPath}/${normalizedId}/messages`);
      const messagesSnap = await getDocs(messagesRef);
      
      results.push({
        id,
        normalizedId,
        exists: !messagesSnap.empty,
        messageCount: messagesSnap.size
      });
    } catch (error) {
      console.error(`Error checking messages for ID ${id}:`, error);
      results.push({
        id,
        normalizedId: normalizeApplicationId(id),
        exists: false,
        messageCount: 0,
        error: String(error)
      });
    }
  }
  
  return results;
}

/**
 * Migration utility: Copy messages from one ID to another
 * Use this to resolve situations where messages are split across different IDs
 * @param sourceId Source application ID
 * @param targetId Target application ID 
 * @param collectionPath Collection path to use
 * @returns Promise resolving to number of messages migrated
 */
export async function migrateMessages(
  sourceId: string,
  targetId: string,
  collectionPath: string = "protocolReviewApplications"
): Promise<number> {
  if (!sourceId || !targetId) return 0;
  
  // Normalize IDs
  const normalizedSourceId = normalizeApplicationId(sourceId);
  const normalizedTargetId = normalizeApplicationId(targetId);
  
  // Check if source and target are the same (already normalized)
  if (normalizedSourceId === normalizedTargetId) {
    console.log("Source and target IDs are the same after normalization, no migration needed");
    return 0;
  }
  
  try {
    // Get source messages
    const sourceMessagesRef = collection(db, `${collectionPath}/${normalizedSourceId}/messages`);
    const sourceSnapshot = await getDocs(sourceMessagesRef);
    
    if (sourceSnapshot.empty) {
      console.log(`No messages found at source ${collectionPath}/${normalizedSourceId}/messages`);
      return 0;
    }
    
    // Prepare target collection
    const targetMessagesRef = collection(db, `${collectionPath}/${normalizedTargetId}/messages`);
    
    // Copy messages
    const batch = writeBatch(db);
    let count = 0;
    
    sourceSnapshot.forEach((document) => {
      const data = document.data();
      
      // Create a new document reference in target collection
      const newDocRef = doc(targetMessagesRef);
      
      // Add to batch
      batch.set(newDocRef, {
        text: data.text || "",
        senderId: data.senderId || "",
        senderName: data.senderName || "Unknown",
        senderRole: data.senderRole || "",
        timestamp: data.timestamp || serverTimestamp(),
        read: data.read || false,
        // Add migration metadata
        migratedFrom: normalizedSourceId,
        migratedAt: serverTimestamp()
      });
      
      count++;
    });
    
    // Execute batch
    await batch.commit();
    
    console.log(`Successfully migrated ${count} messages from ${normalizedSourceId} to ${normalizedTargetId}`);
    return count;
  } catch (error) {
    console.error("Error migrating messages:", error);
    throw error;
  }
} 