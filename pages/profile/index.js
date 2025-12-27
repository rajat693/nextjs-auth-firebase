import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import LoadingSpinner from '../../components/LoadingSpinner';
import Link from 'next/link';
import Image from 'next/image';

export default function Profile() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      await new Promise(resolve => setTimeout(resolve, 500));
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
      {/* Navigation Bar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Profile</h1>
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

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Profile Header */}
          <div className="bg-linear-to-r from-blue-600 to-blue-400 px-6 py-12">
            <div className="flex items-center gap-6">
              {user?.photoURL && (
                <Image
                  src={user.photoURL}
                  alt="Profile"
                  className="rounded-full border-4 border-white shadow-lg"
                  width={96}
                  height={96}
                />
              )}
              <div className="text-white">
                <h2 className="text-3xl font-bold">{user?.displayName}</h2>
                <p className="text-blue-100 mt-1">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-6 py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Account Information
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                  {user?.uid}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user?.emailVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {user?.emailVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.metadata?.creationTime}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Sign In</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.metadata?.lastSignInTime}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
}
