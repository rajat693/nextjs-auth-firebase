import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Settings() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setLoggingOut(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (loggingOut) {
    return <LoadingSpinner message="Logging out..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">App Settings</h2>
          <p className="text-gray-600 mb-6">
            This is a protected settings page. Customize your preferences here.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-700">Email Notifications</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                Enabled
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-700">Dark Mode</span>
              <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm">
                Disabled
              </button>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-700">Two-Factor Authentication</span>
              <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm">
                Setup
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}