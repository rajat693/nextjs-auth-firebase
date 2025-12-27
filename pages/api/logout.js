import { adminAuth } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionCookie = req.cookies.session;

  try {
    // 1. Revoke Firebase tokens (IMPORTANT for security)
    if (sessionCookie) {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      // Revoke all refresh tokens for this user
      await adminAuth.revokeRefreshTokens(decodedClaims.sub);
    }
  } catch (error) {
    // If session invalid, still clear cookie
    console.error('Error revoking tokens:', error);
  }

  // 2. Clear session cookie
  res.setHeader('Set-Cookie', [
    'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
  ]);

  return res.status(200).json({ success: true });
}