/**
 * Debugging utilities for the messaging system
 * These can help diagnose issues with message collections and application IDs
 */

import { 
  findMessagesCollections, 
  checkMessagesCollectionExists,
  normalizeApplicationId
} from './index';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Check if the application document exists
 * @param applicationId The application ID to check
 * @param collectionPath The collection path
 * @returns Promise resolving to whether the document exists
 */
export async function checkApplicationExists(
  applicationId: string,
  collectionPath: string = "protocolReviewApplications"
): Promise<{exists: boolean, path: string, normalizedId: string}> {
  if (!applicationId) {
    return {exists: false, path: '', normalizedId: ''};
  }
  
  const normalizedId = normalizeApplicationId(applicationId);
  const docRef = doc(db, collectionPath, normalizedId);
  const docSnap = await getDoc(docRef);
  
  return {
    exists: docSnap.exists(),
    path: `${collectionPath}/${normalizedId}`,
    normalizedId
  };
}

/**
 * Debug utility to check all possible collections for an application
 * @param application The application object with possible ID fields
 * @returns Promise resolving to debugging information
 */
export async function debugMessagingForApplication(application: any): Promise<{
  possibleIds: string[];
  normalizedIds: string[];
  applicationDocuments: Array<{id: string, normalizedId: string, exists: boolean, path: string}>;
  collectionsFound: Array<{id: string, normalizedId: string, exists: boolean, messageCount: number}>;
}> {
  if (!application) {
    return {
      possibleIds: [],
      normalizedIds: [],
      applicationDocuments: [],
      collectionsFound: []
    };
  }

  // Extract all possible IDs from the application
  const possibleIds = [
    application.id,
    application.applicationCode,
    application.recCode,
    application.spupRecCode,
    // Add any other possible ID fields here
  ].filter(Boolean); // Filter out nullish values
  
  // Generate normalized versions of each ID
  const normalizedIds = possibleIds.map(id => normalizeApplicationId(id));
  
  // Check if the application documents exist
  const applicationDocumentsPromises = possibleIds.map(id => 
    checkApplicationExists(id).then(result => ({
      id,
      normalizedId: result.normalizedId,
      exists: result.exists,
      path: result.path
    }))
  );
  const applicationDocuments = await Promise.all(applicationDocumentsPromises);
  
  // Check which message collections exist
  const collectionsFound = await findMessagesCollections(possibleIds);
  
  return {
    possibleIds,
    normalizedIds, 
    applicationDocuments,
    collectionsFound
  };
}

/**
 * Create a debugging string for messaging issues
 * @param application The application object with possible ID fields
 * @returns HTML string with debug information
 */
export async function createMessagingDebugInfo(application: any): Promise<string> {
  const debug = await debugMessagingForApplication(application);
  
  return `
    <div style="font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 4px;">
      <h3>Messaging Debug Information</h3>
      
      <p><strong>Possible IDs (${debug.possibleIds.length}):</strong> ${debug.possibleIds.join(', ') || 'None'}</p>
      <p><strong>Normalized IDs (${debug.normalizedIds.length}):</strong> ${debug.normalizedIds.join(', ') || 'None'}</p>
      
      <h4>Application Documents:</h4>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Original ID</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Normalized ID</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Exists?</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Path</th>
        </tr>
        ${debug.applicationDocuments.map(item => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.id}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.normalizedId}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background: ${item.exists ? '#d4edda' : '#f8d7da'}">
              ${item.exists ? '✓' : '✗'}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.path}</td>
          </tr>
        `).join('')}
      </table>
      
      <h4>Message Collections Found:</h4>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Original ID</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Normalized ID</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Exists?</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Message Count</th>
        </tr>
        ${debug.collectionsFound.map(item => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.id}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.normalizedId}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background: ${item.exists ? '#d4edda' : '#f8d7da'}">
              ${item.exists ? '✓' : '✗'}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.messageCount}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;
} 