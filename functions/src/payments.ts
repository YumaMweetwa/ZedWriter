import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { createHmac } from 'crypto';

const db = getFirestore();

export const handlePaymentWebhook = async (request: Request, response: Response) => {
  // Verify webhook signature
  const signature = request.headers['x-webhook-signature'] as string;
  const secret = process.env.PAYMENTS_PROVIDER_WEBHOOK_SECRET;
  
  if (!secret) {
    console.error('Payment webhook secret not configured');
    return response.status(500).json({ error: 'Server configuration error' });
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(JSON.stringify(request.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('Invalid webhook signature');
    return response.status(401).json({ error: 'Invalid signature' });
  }

  const { provider_reference, status, amount, currency, metadata } = request.body;

  if (!provider_reference) {
    console.error('Missing provider reference');
    return response.status(400).json({ error: 'Missing provider reference' });
  }

  try {
    // Find payment by provider reference
    const paymentQuery = await db
      .collection('payments')
      .where('providerRef', '==', provider_reference)
      .limit(1)
      .get();

    if (paymentQuery.empty) {
      console.error('Payment not found for reference:', provider_reference);
      return response.status(404).json({ error: 'Payment not found' });
    }

    const paymentDoc = paymentQuery.docs[0];
    const paymentData = paymentDoc.data();

    // Check for idempotency - don't process if already confirmed
    if (paymentData.status === 'confirmed') {
      console.log('Payment already confirmed:', provider_reference);
      return response.status(200).json({ status: 'already_processed' });
    }

    // Update payment status
    await paymentDoc.ref.update({
      status,
      updatedAt: new Date(),
      webhookData: {
        amount,
        currency,
        metadata,
        processedAt: new Date()
      }
    });

    // If payment is confirmed, trigger referral processing
    if (status === 'confirmed' && paymentData.uid) {
      try {
        await processReferralReward(paymentData.uid, paymentData.submissionId, amount);
      } catch (error) {
        console.error('Referral processing failed:', error);
        // Don't fail the webhook for referral errors
      }
    }

    console.log('Payment webhook processed successfully:', provider_reference);
    return response.status(200).json({ status: 'success' });

  } catch (error) {
    console.error('Payment webhook processing error:', error);
    return response.status(500).json({ error: 'Processing failed' });
  }
};

const processReferralReward = async (uid: string, submissionId: string, amount: number) => {
  // Get user data
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists || !userDoc.data()?.referredBy) {
    return; // No referrer, nothing to process
  }

  const userData = userDoc.data()!;
  const referrerUid = userData.referredBy;

  // Get submission data to determine type
  if (!submissionId) return;
  
  const submissionDoc = await db.collection('submissions').doc(submissionId).get();
  if (!submissionDoc.exists) return;

  const submissionData = submissionDoc.data()!;
  const submissionType = submissionData.type;

  // Determine points based on submission type
  let points = 0;
  let event = '';

  switch (submissionType) {
    case 'proposal':
      points = 25;
      event = 'proposal_paid';
      break;
    case 'dissertation':
      points = 50;
      event = 'dissertation_paid';
      break;
    default:
      return; // No rewards for other types
  }

  // Check if this event has already been recorded to prevent duplicates
  const existingReward = await db
    .collection('referrals')
    .where('ownerUid', '==', referrerUid)
    .where('event', '==', event)
    .where('sourceUid', '==', uid)
    .limit(1)
    .get();

  if (!existingReward.empty) {
    console.log('Referral reward already processed');
    return;
  }

  // Create referral record and update points in a transaction
  await db.runTransaction(async (transaction) => {
    const referrerDocRef = db.collection('users').doc(referrerUid);
    const referrerDoc = await transaction.get(referrerDocRef);

    if (!referrerDoc.exists) return;

    const referrerData = referrerDoc.data()!;
    const newPoints = (referrerData.points || 0) + points;

    // Update referrer's points
    transaction.update(referrerDocRef, {
      points: newPoints,
      updatedAt: new Date()
    });

    // Create referral record
    const referralRef = db.collection('referrals').doc();
    transaction.set(referralRef, {
      ownerUid: referrerUid,
      event,
      deltaPoints: points,
      sourceUid: uid,
      createdAt: new Date()
    });
  });

  console.log(`Processed referral reward: ${points} points for ${event}`);
};

export const startPayment = async (paymentData: {
  uid: string;
  submissionId?: string;
  amount: number;
  method: string;
  provider: string;
}) => {
  // This is a placeholder for payment initialization
  // In a real implementation, you would integrate with the payment provider's API
  
  const providerRef = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create payment record
  const paymentDoc = await db.collection('payments').add({
    uid: paymentData.uid,
    submissionId: paymentData.submissionId || '',
    amount: paymentData.amount,
    currency: 'ZMW',
    method: paymentData.method,
    provider: paymentData.provider,
    providerRef,
    status: 'initiated',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return {
    paymentId: paymentDoc.id,
    providerRef,
    // In reality, this would be the provider's checkout URL
    checkoutUrl: `https://payment-provider.com/checkout?ref=${providerRef}`
  };
};
