import { adminAuth, adminDb } from '../../lib/firebaseAdmin';
import admin from 'firebase-admin';

export default async function handler(req, res) {
  // Verify authentication
  const sessionCookie = req.cookies.session;

  if (!sessionCookie) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    if (req.method === 'GET') {
      // Get user details from Firestore
      const docRef = adminDb.collection('user-details').doc(userId);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        return res.status(200).json({
          success: true,
          data: docSnap.data(),
        });
      } else {
        return res.status(200).json({
          success: true,
          data: null,
        });
      }
    } else if (req.method === 'POST') {
      // Save user details to Firestore
      const { userInput } = req.body;

      if (!userInput || !userInput.trim()) {
        return res.status(400).json({ error: 'User input is required' });
      }

      const docRef = adminDb.collection('user-details').doc(userId);
      await docRef.set({
        userInput: userInput.trim(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        email: decodedClaims.email,
        displayName: decodedClaims.name || null,
      }, { merge: true });

      return res.status(200).json({
        success: true,
        message: 'Data saved successfully',
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in user-details API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}