import React from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { SpinnerIcon } from "../components/Icons";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Home() {
  const { user, initializing, handleSignOut, signingOut, error } = useAuth();

  // Show loading spinner while checking auth state
  if (initializing) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
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
                className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                {signingOut ? <><SpinnerIcon className="h-5 w-5" /> Logging out...</> : "Logout"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome, {user?.displayName || "User"}! 👋
          </h2>
          <p className="text-gray-600 mb-4">
            You are successfully authenticated and viewing a protected page.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              User Information:
            </h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>
                <strong>Name:</strong> {user?.displayName}
              </li>
              <li>
                <strong>Email:</strong> {user?.email}
              </li>
              <li>
                <strong>UID:</strong> {user?.uid}
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Navigation
          </h3>
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
      </main>
    </div>
  );
}
