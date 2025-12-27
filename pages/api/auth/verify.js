import { adminAuth } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionCookie = req.cookies.session;

  if (!sessionCookie) {
    return res.status(401).json({ error: 'No session cookie found' });
  }

  try {
    // Verify the session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    return res.status(200).json({ 
      valid: true,
      uid: decodedClaims.uid,
      email: decodedClaims.email 
    });
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return res.status(401).json({ error: 'Invalid session cookie' });
  }
}