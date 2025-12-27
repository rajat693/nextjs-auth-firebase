import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Profile() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [userInput, setUserInput] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [loadingData, setLoadingData] = React.useState(true);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [saveError, setSaveError] = React.useState(null);

  // Load user data from backend API
  React.useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const response = await fetch('/api/user-details');
          
          // Handle 401 - session invalid
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          
          const result = await response.json();

          if (result.success && result.data) {
            setUserInput(result.data.userInput || '');
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setLoadingData(false);
        }
      }
    };

    loadUserData();
  }, [user, router]);

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      // 1. Backend logout
      await fetch('/api/logout', { method: 'POST' });
      
      // 2. Firebase signout
      await signOut();
      
      // 3. Redirect
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setLoggingOut(false);
    }
  };

  const handleSave = async () => {
    if (!userInput.trim()) {
      setSaveError('Please enter some text');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/user-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput }),
      });

      // Handle 401 - session invalid
      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const result = await response.json();

      if (response.ok && result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(result.error || 'Failed to save data');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      setSaveError('Failed to save data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
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
                <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden">
                  <Image
                    src={user.photoURL}
                    alt="Profile Picture"
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
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
            <dl className="space-y-4 mb-8">
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

            {/* User Input Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your Notes
              </h3>
              
              {loadingData ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="userInput" className="block text-sm font-medium text-gray-700 mb-2">
                      Enter your notes or details:
                    </label>
                    <textarea
                      id="userInput"
                      rows="4"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your notes here... (Press Enter to save)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Press Enter to save or click the Save button
                    </p>
                  </div>

                  {/* Success/Error Messages */}
                  {saveSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm font-medium">✓ Saved successfully!</p>
                    </div>
                  )}

                  {saveError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">{saveError}</p>
                    </div>
                  )}

                  {/* Save Button */}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </span>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}