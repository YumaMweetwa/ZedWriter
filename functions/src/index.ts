import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { handlePaymentWebhook } from './payments';
import { processReferralEvent } from './referrals';
import { generateTopics } from './topics';

initializeApp();

const db = getFirestore();

// Webhook handler for payments
export const paymentsWebhook = onRequest(async (request, response) => {
  try {
    await handlePaymentWebhook(request, response);
  } catch (error) {
    console.error('Payment webhook error:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
});

// Callable function to update submission status (admin only)
export const adminUpdateStatus = onCall(async (request) => {
  // Verify admin role
  if (!request.auth?.token?.admin) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  const { submissionId, status, notes } = request.data;

  if (!submissionId || !status) {
    throw new HttpsError('invalid-argument', 'Missing required parameters');
  }

  await db.collection('submissions').doc(submissionId).update({
    status,
    notes: notes || '',
    updatedAt: new Date()
  });

  return { success: true };
});

// Generate referral link
export const generateReferralLink = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userDoc = await db.collection('users').doc(request.auth.uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User not found');
  }

  const userData = userDoc.data();
  const referralCode = userData?.referralCode;

  if (!referralCode) {
    throw new HttpsError('internal', 'No referral code found');
  }

  const baseUrl = process.env.VITE_APP_URL || 'https://zedwriter.com';
  return { 
    referralLink: `${baseUrl}/signup?ref=${referralCode}`,
    referralCode 
  };
});

// Create announcement (admin only)
export const createAnnouncement = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  const { title, body } = request.data;

  if (!title || !body) {
    throw new HttpsError('invalid-argument', 'Title and body are required');
  }

  const docRef = await db.collection('announcements').add({
    title,
    body,
    createdAt: new Date(),
    createdBy: request.auth.uid
  });

  return { id: docRef.id };
});

// Moderate material (admin only)
export const moderateMaterial = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  const { materialId, status, reason } = request.data;

  if (!materialId || !status) {
    throw new HttpsError('invalid-argument', 'Missing required parameters');
  }

  await db.collection('materials').doc(materialId).update({
    status,
    moderationReason: reason || '',
    moderatedAt: new Date(),
    updatedAt: new Date()
  });

  return { success: true };
});

// Topic generation
export const generateTopicsFunction = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { domain, subdomain, department, keywords, studyArea, requirements } = request.data;

  if (!domain) {
    throw new HttpsError('invalid-argument', 'Domain is required');
  }

  try {
    const topics = await generateTopics({
      domain,
      subdomain,
      department,
      keywords,
      studyArea,
      requirements
    });

    return { topics };
  } catch (error) {
    console.error('Topic generation error:', error);
    throw new HttpsError('internal', 'Failed to generate topics');
  }
});

// Firestore triggers for referral processing
export const processPaymentForReferral = onDocumentUpdated('payments/{paymentId}', async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  // Check if payment status changed to confirmed
  if (beforeData?.status !== 'confirmed' && afterData?.status === 'confirmed') {
    try {
      await processReferralEvent(afterData);
    } catch (error) {
      console.error('Referral processing error:', error);
    }
  }
});

// Audit logging for admin actions
export const auditAdminActions = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  const { action, resourceId, details } = request.data;

  await db.collection('audit_logs').add({
    adminId: request.auth.uid,
    action,
    resourceId: resourceId || '',
    details: details || {},
    timestamp: new Date()
  });

  return { success: true };
});
