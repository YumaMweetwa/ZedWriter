import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export const processReferralEvent = async (paymentData: any) => {
  const { uid, submissionId, amount, status } = paymentData;

  if (status !== 'confirmed' || !uid) {
    return;
  }

  // Get user data
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    console.log('User not found for referral processing');
    return;
  }

  const userData = userDoc.data()!;
  const referredBy = userData.referredBy;

  if (!referredBy) {
    console.log('User was not referred by anyone');
    return;
  }

  // Get submission data if available
  let submissionType = '';
  if (submissionId) {
    const submissionDoc = await db.collection('submissions').doc(submissionId).get();
    if (submissionDoc.exists) {
      submissionType = submissionDoc.data()!.type;
    }
  }

  // Determine points and event type
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
      console.log('No referral points for this submission type');
      return;
  }

  // Check if this event has already been processed
  const existingReferral = await db
    .collection('referrals')
    .where('ownerUid', '==', referredBy)
    .where('event', '==', event)
    .where('sourceUid', '==', uid)
    .limit(1)
    .get();

  if (!existingReferral.empty) {
    console.log('Referral already processed for this event');
    return;
  }

  // Process referral in transaction
  await db.runTransaction(async (transaction) => {
    const referrerRef = db.collection('users').doc(referredBy);
    const referrerDoc = await transaction.get(referrerRef);

    if (!referrerDoc.exists) {
      console.log('Referrer not found');
      return;
    }

    const referrerData = referrerDoc.data()!;
    const currentPoints = referrerData.points || 0;
    const newPoints = currentPoints + points;

    // Update referrer's points
    transaction.update(referrerRef, {
      points: newPoints,
      updatedAt: new Date()
    });

    // Create referral record
    const referralRef = db.collection('referrals').doc();
    transaction.set(referralRef, {
      ownerUid: referredBy,
      event,
      deltaPoints: points,
      sourceUid: uid,
      createdAt: new Date()
    });
  });

  console.log(`Awarded ${points} referral points to ${referredBy} for ${event}`);
};

export const processSignupReferral = async (newUserUid: string, referralCode: string) => {
  if (!referralCode) return;

  // Find referrer by referral code
  const referrerQuery = await db
    .collection('users')
    .where('referralCode', '==', referralCode)
    .limit(1)
    .get();

  if (referrerQuery.empty) {
    console.log('Invalid referral code:', referralCode);
    return;
  }

  const referrerDoc = referrerQuery.docs[0];
  const referrerUid = referrerDoc.id;

  // Don't allow self-referral
  if (referrerUid === newUserUid) {
    console.log('Self-referral attempted');
    return;
  }

  // Check if signup referral already exists (prevent duplicates)
  const existingReferral = await db
    .collection('referrals')
    .where('ownerUid', '==', referrerUid)
    .where('event', '==', 'signup')
    .where('sourceUid', '==', newUserUid)
    .limit(1)
    .get();

  if (!existingReferral.empty) {
    console.log('Signup referral already processed');
    return;
  }

  const signupPoints = 2;

  // Process signup referral
  await db.runTransaction(async (transaction) => {
    const referrerRef = db.collection('users').doc(referrerUid);
    const newUserRef = db.collection('users').doc(newUserUid);

    const referrerDoc = await transaction.get(referrerRef);
    if (!referrerDoc.exists) return;

    const referrerData = referrerDoc.data()!;
    const currentPoints = referrerData.points || 0;
    const newPoints = currentPoints + signupPoints;

    // Update referrer's points
    transaction.update(referrerRef, {
      points: newPoints,
      updatedAt: new Date()
    });

    // Update new user to record who referred them
    transaction.update(newUserRef, {
      referredBy: referrerUid,
      updatedAt: new Date()
    });

    // Create referral record
    const referralRef = db.collection('referrals').doc();
    transaction.set(referralRef, {
      ownerUid: referrerUid,
      event: 'signup',
      deltaPoints: signupPoints,
      sourceUid: newUserUid,
      createdAt: new Date()
    });
  });

  console.log(`Awarded ${signupPoints} signup referral points to ${referrerUid}`);
};
