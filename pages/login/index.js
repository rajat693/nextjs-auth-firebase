import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { GoogleIcon, SpinnerIcon } from '../../components/Icons';

export default function Login() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Redirect to dashboard or redirect URL if already logged in
    if (user) {
      const redirect = router.query.redirect || '/';
      router.push(redirect);
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Redirect will happen automatically via useEffect
    } catch (err) {
      setError(err.message);
      setSigningIn(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Don't show login page if user is already authenticated
  if (user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to continue to your dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {signingIn ? (
            <>
              <SpinnerIcon className="h-5 w-5" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <GoogleIcon />
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>By signing in, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  );
}
