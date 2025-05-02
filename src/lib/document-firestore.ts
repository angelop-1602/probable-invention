import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Document } from '@/components/rec-chair/application/types';

/**
 * Retrieves a document URL from Firestore
 * 
 * @param applicationId - The ID of the application
 * @param documentId - The ID or name of the document
 * @returns Promise with the document data including the URL
 */
export async function getDocumentUrl(
  applicationId: string,
  documentId: string
): Promise<Document | null> {
  try {
    const applicationRef = doc(db, 'protocolReviewApplications', applicationId);
    const applicationSnap = await getDoc(applicationRef);
    
    if (!applicationSnap.exists()) {
      console.error(`Application not found: ${applicationId}`);
      return null;
    }
    
    const applicationData = applicationSnap.data();
    
    // Find the document in the documents array
    // Use various possible identifiers since the Document type has multiple ways to identify a document
    const documentData = applicationData?.documents?.find(
      (doc: Document) => 
        doc.name === documentId || 
        doc.fileName === documentId || 
        doc.documentName === documentId
    );
    
    if (!documentData) {
      console.error(`Document not found in application: ${documentId}`);
      return null;
    }
    
    return documentData;
  } catch (error) {
    console.error('Error getting document URL:', error);
    throw error;
  }
}

/**
 * Updates a document in Firestore to include the zip URL
 * 
 * @param applicationId - The ID of the application
 * @param documentId - The ID or name of the document
 * @param storagePath - The storage path where the zip file is stored
 * @returns Promise resolved when the update is complete
 */
export async function updateDocumentUrl(
  applicationId: string,
  documentId: string,
  storagePath: string
): Promise<void> {
  try {
    // First get the application document
    const applicationRef = doc(db, 'protocolReviewApplications', applicationId);
    const applicationSnap = await getDoc(applicationRef);
    
    if (!applicationSnap.exists()) {
      throw new Error(`Application not found: ${applicationId}`);
    }
    
    const applicationData = applicationSnap.data();
    
    // Find the document in the documents array
    let documentIndex = -1;
    const documents = applicationData?.documents || [];
    
    for (let i = 0; i < documents.length; i++) {
      // Check different possible document identifiers
      if (
        documents[i].name === documentId || 
        documents[i].fileName === documentId || 
        documents[i].documentName === documentId
      ) {
        documentIndex = i;
        break;
      }
    }
    
    if (documentIndex === -1) {
      throw new Error(`Document not found in application: ${documentId}`);
    }
    
    // Get the download URL from Firebase Storage
    const storageReference = ref(storage, storagePath);
    const downloadUrl = await getDownloadURL(storageReference);
    
    // Create the update
    const documentUpdate = {
      ...documents[documentIndex],
      url: downloadUrl,
      storagePath
    };
    
    // Create a new documents array with the updated document
    const updatedDocuments = [...documents];
    updatedDocuments[documentIndex] = documentUpdate;
    
    // Update the Firestore document
    await updateDoc(applicationRef, {
      documents: updatedDocuments
    });
    
    console.log(`Document URL updated for ${documentId} in application ${applicationId}`);
  } catch (error) {
    console.error('Error updating document URL:', error);
    throw error;
  }
}

/**
 * Adds a new document to the application with the zip URL
 * 
 * @param applicationId - The ID of the application
 * @param document - The document object to add
 * @param storagePath - The storage path where the zip file is stored
 * @returns Promise resolved when the update is complete
 */
export async function addDocumentWithUrl(
  applicationId: string,
  document: Document,
  storagePath: string
): Promise<void> {
  try {
    // Get the download URL from Firebase Storage
    const storageReference = ref(storage, storagePath);
    const downloadUrl = await getDownloadURL(storageReference);
    
    // Add the URL and storage path to the document
    const documentWithUrl = {
      ...document,
      url: downloadUrl,
      storagePath,
      uploadDate: new Date()
    };
    
    // Update the Firestore document
    const applicationRef = doc(db, 'protocolReviewApplications', applicationId);
    await updateDoc(applicationRef, {
      documents: arrayUnion(documentWithUrl)
    });
    
    console.log(`Document added to application ${applicationId}`);
  } catch (error) {
    console.error('Error adding document with URL:', error);
    throw error;
  }
}

export default {
  getDocumentUrl,
  updateDocumentUrl,
  addDocumentWithUrl
}; 