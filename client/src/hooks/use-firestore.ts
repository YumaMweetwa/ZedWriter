import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  QueryConstraint,
  DocumentData 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useFirestoreCollection = <T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const collectionRef = collection(db, collectionName);
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
};

export const useUserSubmissions = (uid: string | undefined) => {
  return useFirestoreCollection(
    'submissions',
    uid ? [where('uid', '==', uid), orderBy('createdAt', 'desc')] : []
  );
};

export const useUserPayments = (uid: string | undefined) => {
  return useFirestoreCollection(
    'payments',
    uid ? [where('uid', '==', uid), orderBy('createdAt', 'desc')] : []
  );
};

export const useAnnouncements = () => {
  return useFirestoreCollection(
    'announcements',
    [orderBy('createdAt', 'desc')]
  );
};

export const useMaterials = (filters: {
  program?: string;
  year?: string;
  type?: string;
} = {}) => {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc')
  ];

  if (filters.program) {
    constraints.unshift(where('program', '==', filters.program));
  }
  if (filters.year) {
    constraints.unshift(where('year', '==', filters.year));
  }
  if (filters.type) {
    constraints.unshift(where('type', '==', filters.type));
  }

  return useFirestoreCollection('materials', constraints);
};
