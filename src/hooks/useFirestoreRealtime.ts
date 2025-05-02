import { useState, useEffect, useCallback } from 'react';
import { collection, query, doc, onSnapshot, QueryConstraint, DocumentData, Unsubscribe, FirestoreError } from 'firebase/firestore';
import { db } from '@/lib/firebase-service';
type FirestoreState<T> = {
  data: T | null;
  loading: boolean;
  error: FirestoreError | null;
  refresh?: () => Promise<void>;
};

/**
 * A hook for subscribing to real-time Firestore document updates
 */
export function useFirestoreDocument<T = DocumentData>(
  collectionName: string,
  documentId: string,
) {
  const [state, setState] = useState<FirestoreState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    setState(prev => ({ ...prev, loading: true }));

    const docRef = doc(db, collectionName, documentId);
    
    const unsubscribe: Unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() } as T;
          setState({ data, loading: false, error: null });
        } else {
          setState({ data: null, loading: false, error: null });
        }
      },
      (error) => {
        setState({ data: null, loading: false, error });
        console.error('Firestore document subscription error:', error);
      }
    );

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, [collectionName, documentId]);

  return state;
}

/**
 * A hook for subscribing to real-time Firestore collection updates
 */
export function useFirestoreCollection<T = DocumentData>(
  collectionName: string,
  queryConstraints: QueryConstraint[] = [],
) {
  const [state, setState] = useState<FirestoreState<T[]>>({
    data: null,
    loading: true,
    error: null,
  });

  // Create callback to force refresh the data
  const refresh = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    // The useEffect will handle the actual refresh when queryConstraints changes
    // We just need to set loading to true to trigger a UI update
    return Promise.resolve();
  }, []);

  useEffect(() => {
    setState(prev => ({ ...prev, loading: true }));

    const collectionRef = collection(db, collectionName);
    const queryRef = query(collectionRef, ...queryConstraints);
    
    const unsubscribe: Unsubscribe = onSnapshot(
      queryRef,
      (snapshot) => {
        const data = snapshot.docs.map(
          doc => ({ id: doc.id, ...doc.data() }) as T
        );
        setState({ data, loading: false, error: null, refresh });
      },
      (error) => {
        setState({ data: null, loading: false, error, refresh });
        console.error('Firestore collection subscription error:', error);
      }
    );

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, [collectionName, JSON.stringify(queryConstraints), refresh]);

  return { ...state, refresh };
} 