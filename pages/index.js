import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import LoadingSpinner from '../components/LoadingSpinner';
import Link from 'next/link';

export default function Home() {
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

  // Show full-page loader during initial load or logout
  if (loading) {
    return <LoadingSpinner />;
  }

  if (loggingOut) {
    return <LoadingSpinner message="Logging out..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">
                {user?.displayName || user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome, {user?.displayName || 'User'}! 👋
          </h2>
          <p className="text-gray-600 mb-4">
            You are successfully authenticated and viewing a protected page.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">User Information:</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li><strong>Name:</strong> {user?.displayName}</li>
              <li><strong>Email:</strong> {user?.email}</li>
              <li><strong>UID:</strong> {user?.uid}</li>
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Projects</span>
                <span className="font-bold text-blue-600">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Tasks</span>
                <span className="font-bold text-green-600">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed</span>
                <span className="font-bold text-purple-600">45</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Navigation</h3>
            <div className="space-y-2">
              <Link
                href="/profile"
                className="block px-4 py-2 bg-gray-700 hover:bg-gray-500 rounded-lg transition"
              >
                View Profile →
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 bg-gray-700 hover:bg-gray-500 rounded-lg transition"
              >
                Settings →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
