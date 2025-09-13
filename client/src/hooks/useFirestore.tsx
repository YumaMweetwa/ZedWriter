import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  QueryConstraint,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useApp } from '@/contexts/AppContext';

export const useFirestoreCollection = <T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...constraints);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const documents: T[] = [];
        snapshot.forEach((doc) => {
          documents.push({ ...doc.data(), id: doc.id } as T);
        });
        setData(documents);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error(`Error fetching ${collectionName}:`, error);
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
};

export const useFirestoreDocument = <T extends DocumentData>(
  collectionName: string,
  documentId: string | null
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentId) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, collectionName, documentId),
      (doc) => {
        if (doc.exists()) {
          setData({ ...doc.data(), id: doc.id } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error(`Error fetching document ${documentId}:`, error);
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, documentId]);

  return { data, loading, error };
};

export const useFirestoreOperations = () => {
  const { showToast } = useApp();

  const addDocument = async (collectionName: string, data: any) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Document created successfully.'
      });
      
      return docRef.id;
    } catch (error: any) {
      console.error('Error adding document:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create document. Please try again.'
      });
      throw error;
    }
  };

  const updateDocument = async (collectionName: string, documentId: string, data: any) => {
    try {
      await updateDoc(doc(db, collectionName, documentId), {
        ...data,
        updatedAt: new Date(),
      });
      
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Document updated successfully.'
      });
    } catch (error: any) {
      console.error('Error updating document:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update document. Please try again.'
      });
      throw error;
    }
  };

  const deleteDocument = async (collectionName: string, documentId: string) => {
    try {
      await deleteDoc(doc(db, collectionName, documentId));
      
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Document deleted successfully.'
      });
    } catch (error: any) {
      console.error('Error deleting document:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete document. Please try again.'
      });
      throw error;
    }
  };

  const getDocument = async (collectionName: string, documentId: string) => {
    try {
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id };
      } else {
        return null;
      }
    } catch (error: any) {
      console.error('Error getting document:', error);
      throw error;
    }
  };

  return {
    addDocument,
    updateDocument,
    deleteDocument,
    getDocument,
  };
};
