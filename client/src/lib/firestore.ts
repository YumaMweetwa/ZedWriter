import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { 
  Submission, 
  User, 
  Message, 
  Payment, 
  Announcement, 
  Material,
  FileRequest
} from '../types';

// Users
export const getUserData = async (uid: string) => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } as User : null;
};

export const updateUserData = async (uid: string, data: Partial<User>) => {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: new Date()
  });
};

// Submissions
export const createSubmission = async (submissionData: Omit<Submission, 'id'>) => {
  const docRef = await addDoc(collection(db, 'submissions'), {
    ...submissionData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return docRef.id;
};

export const getUserSubmissions = (uid: string, callback: (submissions: Submission[]) => void) => {
  const q = query(
    collection(db, 'submissions'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const submissions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Submission[];
    callback(submissions);
  });
};

export const getAllSubmissions = (callback: (submissions: Submission[]) => void) => {
  const q = query(
    collection(db, 'submissions'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const submissions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Submission[];
    callback(submissions);
  });
};

export const updateSubmissionStatus = async (submissionId: string, status: string, notes?: string) => {
  await updateDoc(doc(db, 'submissions', submissionId), {
    status,
    notes,
    updatedAt: new Date()
  });
};

// Messages
export const getMessages = (threadId: string, callback: (messages: Message[]) => void) => {
  const q = query(
    collection(db, 'messages', threadId, 'entries'),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Message[];
    callback(messages);
  });
};

export const sendMessage = async (threadId: string, message: Omit<Message, 'id'>) => {
  await addDoc(collection(db, 'messages', threadId, 'entries'), {
    ...message,
    createdAt: new Date()
  });
  
  // Update thread metadata
  await updateDoc(doc(db, 'messages', threadId), {
    lastMessage: message.text || 'File attachment',
    lastMessageAt: new Date(),
    unreadBy: message.from === 'user' ? ['admin'] : ['user']
  });
};

// Payments
export const createPayment = async (paymentData: Omit<Payment, 'id'>) => {
  const docRef = await addDoc(collection(db, 'payments'), {
    ...paymentData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return docRef.id;
};

export const getUserPayments = async (uid: string) => {
  const q = query(
    collection(db, 'payments'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Payment[];
};

// Announcements
export const getAnnouncements = (callback: (announcements: Announcement[]) => void) => {
  const q = query(
    collection(db, 'announcements'),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  
  return onSnapshot(q, (snapshot) => {
    const announcements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Announcement[];
    callback(announcements);
  });
};

export const createAnnouncement = async (announcement: Omit<Announcement, 'id'>) => {
  const docRef = await addDoc(collection(db, 'announcements'), {
    ...announcement,
    createdAt: new Date()
  });
  return docRef.id;
};

// Materials
export const getMaterials = async (filters: {
  program?: string;
  year?: string;
  type?: string;
  search?: string;
}) => {
  let q = query(collection(db, 'materials'));
  
  if (filters.program) {
    q = query(q, where('program', '==', filters.program));
  }
  if (filters.year) {
    q = query(q, where('year', '==', filters.year));
  }
  if (filters.type) {
    q = query(q, where('type', '==', filters.type));
  }
  
  q = query(q, where('status', '==', 'published'), orderBy('createdAt', 'desc'));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Material[];
};

export const uploadMaterial = async (materialData: Omit<Material, 'id'>) => {
  const docRef = await addDoc(collection(db, 'materials'), {
    ...materialData,
    status: 'in_review',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return docRef.id;
};

export const getMaterialsForModeration = (callback: (materials: Material[]) => void) => {
  const q = query(
    collection(db, 'materials'),
    where('status', '==', 'in_review'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const materials = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Material[];
    callback(materials);
  });
};

export const moderateMaterial = async (materialId: string, status: 'published' | 'rejected', reason?: string) => {
  await updateDoc(doc(db, 'materials', materialId), {
    status,
    moderationReason: reason,
    moderatedAt: new Date(),
    updatedAt: new Date()
  });
};

// File Requests
export const createFileRequest = async (request: Omit<FileRequest, 'id'>) => {
  const docRef = await addDoc(collection(db, 'file_requests'), {
    ...request,
    status: 'open',
    createdAt: new Date()
  });
  return docRef.id;
};
