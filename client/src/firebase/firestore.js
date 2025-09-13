// Firestore operations
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { getFirebaseFirestore } from './config.js';

export class FirestoreManager {
  constructor() {
    this.db = getFirebaseFirestore();
  }

  // Submissions
  async createSubmission(submissionData) {
    try {
      const submission = {
        ...submissionData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(this.db, 'submissions'), submission);
      return docRef.id;
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  }

  async getSubmission(id) {
    try {
      const docRef = doc(this.db, 'submissions', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting submission:', error);
      throw error;
    }
  }

  async getUserSubmissions(uid, pageSize = 10, lastDoc = null) {
    try {
      let q = query(
        collection(this.db, 'submissions'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const submissions = [];
      
      querySnapshot.forEach((doc) => {
        submissions.push({ id: doc.id, ...doc.data() });
      });

      return {
        submissions,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error getting user submissions:', error);
      throw error;
    }
  }

  async updateSubmissionStatus(id, status, adminNotes = '') {
    try {
      const docRef = doc(this.db, 'submissions', id);
      await updateDoc(docRef, {
        status,
        adminNotes,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating submission status:', error);
      throw error;
    }
  }

  // Messages
  async createMessage(threadId, messageData) {
    try {
      const message = {
        ...messageData,
        createdAt: serverTimestamp(),
        readBy: []
      };

      const docRef = await addDoc(
        collection(this.db, 'messages', threadId, 'entries'),
        message
      );
      
      // Update thread metadata
      await this.updateMessageThread(threadId, messageData.from);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async updateMessageThread(threadId, lastMessageFrom) {
    try {
      const threadRef = doc(this.db, 'messages', threadId);
      const threadDoc = await getDoc(threadRef);

      if (!threadDoc.exists()) {
        // Create thread metadata
        await updateDoc(threadRef, {
          lastMessageAt: serverTimestamp(),
          lastMessageFrom,
          participants: threadId.includes('_') ? threadId.split('_') : [threadId],
          createdAt: serverTimestamp()
        });
      } else {
        await updateDoc(threadRef, {
          lastMessageAt: serverTimestamp(),
          lastMessageFrom
        });
      }
    } catch (error) {
      console.error('Error updating message thread:', error);
      throw error;
    }
  }

  async getMessages(threadId, pageSize = 20, lastDoc = null) {
    try {
      let q = query(
        collection(this.db, 'messages', threadId, 'entries'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const messages = [];
      
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });

      return {
        messages: messages.reverse(), // Reverse to show oldest first
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  subscribeToMessages(threadId, callback) {
    const q = query(
      collection(this.db, 'messages', threadId, 'entries'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      callback(messages);
    });
  }

  // Materials
  async createMaterial(materialData) {
    try {
      const material = {
        ...materialData,
        status: 'in_review',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(this.db, 'materials'), material);
      return docRef.id;
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  }

  async getMaterials(filters = {}, pageSize = 12, lastDoc = null) {
    try {
      let q = query(
        collection(this.db, 'materials'),
        where('status', '==', 'published')
      );

      // Apply filters
      if (filters.program) {
        q = query(q, where('program', '==', filters.program));
      }
      if (filters.year) {
        q = query(q, where('year', '==', filters.year));
      }
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }

      q = query(q, orderBy('createdAt', 'desc'), limit(pageSize));

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const materials = [];
      
      querySnapshot.forEach((doc) => {
        materials.push({ id: doc.id, ...doc.data() });
      });

      return {
        materials,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error getting materials:', error);
      throw error;
    }
  }

  async searchMaterials(searchTerm, filters = {}) {
    try {
      // This is a simple search - in production you'd use Algolia or similar
      const materials = await this.getMaterials(filters, 50);
      
      const filtered = materials.materials.filter(material => 
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return { materials: filtered };
    } catch (error) {
      console.error('Error searching materials:', error);
      throw error;
    }
  }

  // Announcements
  async getAnnouncements(pageSize = 10, lastDoc = null) {
    try {
      let q = query(
        collection(this.db, 'announcements'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const announcements = [];
      
      querySnapshot.forEach((doc) => {
        announcements.push({ id: doc.id, ...doc.data() });
      });

      return {
        announcements,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error getting announcements:', error);
      throw error;
    }
  }

  async markAnnouncementAsRead(announcementId, uid) {
    try {
      const readRef = doc(this.db, 'announcement_reads', `${announcementId}_${uid}`);
      await updateDoc(readRef, {
        announcementId,
        uid,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking announcement as read:', error);
      throw error;
    }
  }

  // Referrals
  async getReferralHistory(uid, pageSize = 10, lastDoc = null) {
    try {
      let q = query(
        collection(this.db, 'referrals'),
        where('ownerUid', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const referrals = [];
      
      querySnapshot.forEach((doc) => {
        referrals.push({ id: doc.id, ...doc.data() });
      });

      return {
        referrals,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error getting referral history:', error);
      throw error;
    }
  }

  async getUserStats(uid) {
    try {
      // Get user document
      const userDoc = await getDoc(doc(this.db, 'users', uid));
      
      // Get submission counts
      const submissionsQuery = query(
        collection(this.db, 'submissions'),
        where('uid', '==', uid)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);
      
      const stats = {
        totalSubmissions: submissionsSnapshot.size,
        activeSubmissions: 0,
        completedSubmissions: 0,
        points: userDoc.data()?.points || 0
      };

      submissionsSnapshot.forEach((doc) => {
        const submission = doc.data();
        if (['pending', 'in_progress', 'under_review'].includes(submission.status)) {
          stats.activeSubmissions++;
        } else if (submission.status === 'completed') {
          stats.completedSubmissions++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Payments
  async createPayment(paymentData) {
    try {
      const payment = {
        ...paymentData,
        status: 'initiated',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(this.db, 'payments'), payment);
      return docRef.id;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async getUserPayments(uid, pageSize = 10, lastDoc = null) {
    try {
      let q = query(
        collection(this.db, 'payments'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const payments = [];
      
      querySnapshot.forEach((doc) => {
        payments.push({ id: doc.id, ...doc.data() });
      });

      return {
        payments,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error getting user payments:', error);
      throw error;
    }
  }

  // File requests
  async createFileRequest(requestData) {
    try {
      const request = {
        ...requestData,
        status: 'open',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(this.db, 'file_requests'), request);
      return docRef.id;
    } catch (error) {
      console.error('Error creating file request:', error);
      throw error;
    }
  }
}

export default FirestoreManager;
