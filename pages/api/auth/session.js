import { adminAuth } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Create session cookie
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    try {
      // Verify the ID token
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      
      // Set session expiration to 14 days
      const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days in milliseconds

      // Create session cookie
      const sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn,
      });

      // Set cookie
      res.setHeader('Set-Cookie', [
        `session=${sessionCookie}; Max-Age=${expiresIn / 1000}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      ]);

      return res.status(200).json({ 
        success: true,
        uid: decodedToken.uid 
      });
    } catch (error) {
      console.error('Error creating session cookie:', error);
      return res.status(401).json({ error: 'Invalid ID token' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}