# Firebase Authentication with Inactivity Timer - Complete Implementation Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Authentication Flow](#authentication-flow)
3. [Inactivity Timer Flow](#inactivity-timer-flow)
4. [Implementation Steps](#implementation-steps)
5. [Complete Code Files](#complete-code-files)
6. [Edge Cases & Error Handling](#edge-cases--error-handling)
7. [Testing Checklist](#testing-checklist)
8. [Environment Variables](#environment-variables)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT SIDE (React)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   _app.js    │───▶│ AuthContext  │───▶│ useInactivity│  │
│  │              │    │              │    │    Timer     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Pages      │    │  Firebase    │    │  Warning     │  │
│  │  (Login,     │    │  Client SDK │    │   Modal      │  │
│  │  Dashboard)  │    │              │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  SERVER SIDE (Next.js API)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Proxy       │    │  /api/auth/  │    │  Firebase   │  │
│  │              │    │   session    │    │  Admin SDK  │  │
│  │  (Route      │    │              │    │              │  │
│  │  Protection) │    │  /api/auth/  │    │              │  │
│  │              │    │   logout     │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Concepts

1. **Client-Side Authentication**: Firebase Client SDK handles OAuth popup (Google/Microsoft)
2. **Server-Side Session Management**: Firebase Admin SDK creates secure HTTP-only session cookies
3. **Route Protection**: Next.js proxy (middleware) checks session cookie before allowing access
4. **Inactivity Tracking**: Custom hook monitors user activity and auto-logouts after 30 minutes
5. **Warning System**: Modal appears at 29 minutes with 60-second countdown
6. **Multiple OAuth Providers**: Supports Google and Microsoft authentication (easily extensible to more providers using DRY pattern)

---

## Authentication Flow

### 1. User Login Flow

```
User clicks "Sign in with Google" or "Sign in with Microsoft"
    ↓
Firebase Client SDK opens OAuth popup (Google/Microsoft)
    ↓
User authenticates with provider (Google/Microsoft)
    ↓
Firebase returns user object + ID token
    ↓
Client sends ID token to /api/auth/session
    ↓
Server verifies ID token with Firebase Admin
    ↓
Server creates session cookie (HttpOnly, Secure)
    ↓
Cookie set in browser
    ↓
User redirected to dashboard
    ↓
Proxy (middleware) validates session cookie on each request
```

### 2. Session Management

- **Session Cookie**: HttpOnly, Secure, SameSite=Lax
- **Expiration**: 14 days (configurable)
- **Validation**: Proxy (middleware) checks cookie on every route
- **Revocation**: On logout, all Firebase tokens are revoked

### 3. Logout Flow

```
User clicks logout OR inactivity timer expires
    ↓
Client calls /api/auth/logout
    ↓
Server revokes all Firebase refresh tokens
    ↓
Server clears session cookie
    ↓
Client calls Firebase signOut()
    ↓
User redirected to /login
```

---

## Inactivity Timer Flow

### Timeline

```
0:00 - User logs in → Timers start
    ↓
User interacts (click, scroll, keydown, mousedown)
    ↓
Timer resets → Fresh 29/30 min timers
    ↓
29:00 - ⚠️ WARNING MODAL APPEARS
    ↓
Background blocked, countdown starts (60s)
    ↓
[User Response Scenarios]
    ↓
Scenario A: User clicks "I'm Still Here"
    → Modal closes, timers reset
    
Scenario B: Countdown reaches 0
    → Auto logout
    
Scenario C: 30 minutes total (safety net)
    → Auto logout
```

### Activity Tracking

**Tracked Events:**
- `mousedown`
- `keydown`
- `scroll`
- `click`

**When Modal is Open:**
- Background events are **ignored**
- Only button click resets timer
- Body scroll disabled
- Keyboard events blocked

---

## Implementation Steps

### Step 1: Environment Setup

1. Install dependencies:
```bash
npm install firebase firebase-admin
```

2. Set up environment variables (see [Environment Variables](#environment-variables))

3. Configure Firebase project in Firebase Console

### Step 2: Firebase Configuration Files

Create client and admin SDK configurations.

### Step 3: Inactivity Timer Hook

Create custom hook for tracking user inactivity.

### Step 4: Authentication Context

Create React context for global auth state management (supports Google & Microsoft).

### Step 5: Icons Component

Create icon components for Google, Microsoft, and loading spinner.

### Step 6: Warning Modal Component

Create modal component for inactivity warning.

### Step 7: API Routes

Create session and logout API endpoints.

### Step 8: Proxy (Route Protection)

Set up route protection proxy.

### Step 9: App Integration

Integrate everything in `_app.js`.

### Step 10: Login Page

Create login page with both Google and Microsoft sign-in options.

### Step 11: Protected Pages

Update pages to handle auth state.

---

## Complete Code Files

### Step 1: Firebase Client Configuration

**File:** `lib/firebase.js`

```javascript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { auth };
```

### Step 2: Firebase Admin Configuration

**File:** `lib/firebaseAdmin.js`

```javascript
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
```

### Step 3: Inactivity Timer Hook

**File:** `hooks/useInactivityTimer.js`

```javascript
import { useEffect, useRef, useState, useCallback } from 'react';

// Inactivity timeout: 30 minutes in milliseconds
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
// Warning timeout: 29 minutes (1 minute before logout)
const WARNING_TIMEOUT = 29 * 60 * 1000; // 29 minutes
// Countdown duration: 60 seconds
const COUNTDOWN_DURATION = 60; // seconds

/**
 * Custom hook to track user inactivity and trigger a callback after a period of inactivity
 * @param {Object} user - The authenticated user object (null if not authenticated)
 * @param {Function} onInactive - Callback function to execute when user is inactive
 * @returns {Object} { showWarning, countdown, resetWarning } - Warning state and controls
 */
export const useInactivityTimer = (user, onInactive) => {
  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const resetInactivityTimerRef = useRef(null);
  const showWarningRef = useRef(false);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);

  const resetWarning = useCallback(() => {
    // Clear countdown timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    showWarningRef.current = false;
    setShowWarning(false);
    setCountdown(COUNTDOWN_DURATION);
    
    // Also reset the inactivity timers if the reset function is available
    if (resetInactivityTimerRef.current) {
      resetInactivityTimerRef.current();
    }
  }, []);

  useEffect(() => {
    // Only track inactivity when user is logged in
    if (!user) {
      // Clear any existing timers if user is not logged in
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      // Reset warning state (defer to avoid synchronous setState in effect)
      showWarningRef.current = false;
      setTimeout(() => {
        setShowWarning(false);
        setCountdown(COUNTDOWN_DURATION);
      }, 0);
      return;
    }

    // Activity events to track
    const activityEvents = [
      'mousedown',
      'keydown',
      'scroll',
      'click',
    ];

    // Function to reset the inactivity timer
    const resetInactivityTimer = () => {
      // Clear existing timers
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      
      // Reset warning state if it was showing
      showWarningRef.current = false;
      setShowWarning(false);
      setCountdown(COUNTDOWN_DURATION);

      // Set warning timer (at 29 minutes)
      warningTimerRef.current = setTimeout(() => {
        showWarningRef.current = true;
        setShowWarning(true);
        setCountdown(COUNTDOWN_DURATION);

        // Start countdown
        countdownTimerRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              // Countdown reached 0, logout
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
              onInactive();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, WARNING_TIMEOUT);

      // Set main inactivity timer (at 30 minutes)
      inactivityTimerRef.current = setTimeout(() => {
        console.log('User inactive for 30 minutes. Logging out...');
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        showWarningRef.current = false;
        setShowWarning(false);
        setCountdown(COUNTDOWN_DURATION);
        onInactive();
      }, INACTIVITY_TIMEOUT);
    };

    // Store reset function in ref so it can be accessed by resetWarning
    resetInactivityTimerRef.current = resetInactivityTimer;

    // Initial timer setup
    resetInactivityTimer();

    // Create handler functions for each event type
    // When warning is showing, ignore background events (only button click should reset)
    const eventHandlers = {};
    activityEvents.forEach((event) => {
      eventHandlers[event] = (e) => {
        // If warning modal is showing, ignore background events
        // Only interactions within the modal (or explicit resetWarning call) should reset timer
        if (showWarningRef.current) {
          // Don't reset timer on background interactions when modal is open
          return;
        }
        resetInactivityTimer();
      };
      window.addEventListener(event, eventHandlers[event]);
    });

    // Cleanup function
    return () => {
      // Clear all timers
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      // Remove event listeners
      activityEvents.forEach((event) => {
        window.removeEventListener(event, eventHandlers[event]);
      });
    };
  }, [user, onInactive]);

  return { showWarning, countdown, resetWarning };
};
```

### Step 4: Authentication Context

**File:** `context/AuthContext.js`

```javascript
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  OAuthProvider,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { useRouter } from "next/router";
import { useInactivityTimer } from "../hooks/useInactivityTimer";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [signingInGoogle, setSigningInGoogle] = useState(false);
  const [signingInMicrosoft, setSigningInMicrosoft] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // handle auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false); // Auth state check is complete
    });

    return unsubscribe;
  }, []);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      // 1. Backend logout to clear session + revoke tokens
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // 2. Firebase signOut (clears client auth)
      await signOut(auth);

      // 3. Redirect to login
      router.replace('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      setError(error.message);
    }
    finally {
      setSigningOut(false);
    }
  }, [router]);

  // Use inactivity timer hook to auto-logout after 30 minutes of inactivity
  const { showWarning, countdown, resetWarning } = useInactivityTimer(user, handleSignOut);

  // Generic sign-in handler to avoid code duplication (DRY principle)
  const handleSignIn = useCallback(async (provider, setSigningInState, providerName) => {
    setSigningInState(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // Send token to backend to create session cookie
      await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });
    } catch (error) {
      console.error(`Error signing in with ${providerName}:`, error);
      setError(error.message);
    } finally {
      setSigningInState(false);
    }
  }, []);

  const handleGoogleSignIn = useCallback(() => {
    const provider = new GoogleAuthProvider();
    return handleSignIn(provider, setSigningInGoogle, "Google");
  }, [handleSignIn]);

  const handleMicrosoftSignIn = useCallback(() => {
    const provider = new OAuthProvider("microsoft.com");
    return handleSignIn(provider, setSigningInMicrosoft, "Microsoft");
  }, [handleSignIn]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      initializing, 
      signingInGoogle,
      signingInMicrosoft,
      signingOut, 
      handleGoogleSignIn, 
      handleMicrosoftSignIn,
      handleSignOut, 
      error,
      showWarning,
      countdown,
      resetWarning
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Step 5: Icons Component

**File:** `components/Icons.js`

```javascript
import React from 'react';

/**
 * Google Icon Component
 * Used for Google Sign-In button
 */
export const GoogleIcon = ({ className = "w-5 h-5", ...props }) => (
  <svg className={className} viewBox="0 0 24 24" {...props}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

/**
 * Microsoft Icon Component
 * Used for Microsoft Sign-In button
 */
export const MicrosoftIcon = ({ className = "w-5 h-5", ...props }) => (
  <svg className={className} viewBox="0 0 23 23" {...props}>
    <path fill="#f25022" d="M0 0h11v11H0z" />
    <path fill="#00a4ef" d="M12 0h11v11H12z" />
    <path fill="#7fba00" d="M0 12h11v11H0z" />
    <path fill="#ffb900" d="M12 12h11v11H12z" />
  </svg>
);

/**
 * Spinner Icon Component
 * Used for loading states
 */
export const SpinnerIcon = ({ className = "w-5 h-5", ...props }) => (
  <div className={`animate-spin rounded-full border-b-2 border-gray-700 ${className}`} {...props}></div>
);
```

### Step 6: Inactivity Warning Modal

**File:** `components/InactivityWarningModal.js`

```javascript
import { useEffect } from 'react';

export default function InactivityWarningModal({ countdown, onDismiss }) {
  // Prevent body scroll and keyboard interaction when modal is open
  useEffect(() => {
    // Save original overflow style
    const originalStyle = window.getComputedStyle(document.body).overflow;
    // Disable body scroll
    document.body.style.overflow = 'hidden';
    
    // Prevent keyboard events from reaching background (except for Escape or button focus)
    const handleKeyDown = (e) => {
      // Allow Escape key to potentially close modal (if needed)
      // Allow Tab for accessibility within modal
      if (e.key !== 'Escape' && e.key !== 'Tab') {
        e.stopPropagation();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      // Restore original overflow style when modal closes
      document.body.style.overflow = originalStyle;
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm"
      onClick={(e) => {
        // Prevent clicking through the backdrop
        e.stopPropagation();
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4"
        onClick={(e) => {
          // Prevent clicks inside modal from bubbling to backdrop
          e.stopPropagation();
        }}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Are you still there?
          </h2>
          <p className="text-gray-600 mb-6">
            You will be logged out in <span className="font-bold text-red-600">{countdown}s</span>
          </p>
          
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24">
              <svg className="transform -rotate-90 w-24 h-24">
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  stroke="#ef4444"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(countdown / 60) * 276.46} 276.46`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-red-600">{countdown}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition"
          >
            I&apos;m Still Here
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Step 7: Session API Route

**File:** `pages/api/auth/session.js`

```javascript
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
```

### Step 8: Logout API Route

**File:** `pages/api/auth/logout.js`

```javascript
import { adminAuth } from '../../../lib/firebaseAdmin';

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
```

### Step 9: Proxy (Route Protection)

**File:** `proxy.js`

```javascript
import { NextResponse } from 'next/server';

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  
  // Get session cookie
  const session = request.cookies.get('session');
  
  // Public paths that don't require authentication
  const isPublicPath = pathname === '/login';
  
  // If accessing login page and already has session, redirect to dashboard
  if (isPublicPath && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If accessing protected route without session, redirect to login
  if (!isPublicPath && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Allow request to continue
  // Verification will happen in API routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
```

### Step 10: App Integration

**File:** `pages/_app.js`

```javascript
import { AuthProvider, useAuth } from '../context/AuthContext';
import InactivityWarningModal from '../components/InactivityWarningModal';
import '../styles/globals.css';

function AppContent({ Component, pageProps }) {
  const { showWarning, countdown, resetWarning } = useAuth();

  return (
    <>
      <Component {...pageProps} />
      {showWarning && (
        <InactivityWarningModal 
          countdown={countdown} 
          onDismiss={resetWarning}
        />
      )}
    </>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AppContent Component={Component} pageProps={pageProps} />
    </AuthProvider>
  );
}
```

### Step 11: Login Page

**File:** `pages/login/index.js`

```javascript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { GoogleIcon, MicrosoftIcon, SpinnerIcon } from '../../components/Icons';

export default function Login() {
  const { user, initializing, handleGoogleSignIn, handleMicrosoftSignIn, signingInGoogle, signingInMicrosoft, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard or redirect URL if already logged in
    if (user && !initializing) {
      const redirect = router.query.redirect || '/';
      router.push(redirect);
    }
  }, [user, initializing, router]);

  // Show loading spinner while checking auth state
  if (initializing) {
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
          disabled={signingInGoogle || signingInMicrosoft}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {signingInGoogle ? (
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

        <button
          onClick={handleMicrosoftSignIn}
          disabled={signingInGoogle || signingInMicrosoft}
          className="mt-3 w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {signingInMicrosoft ? (
            <>
              <SpinnerIcon className="h-5 w-5" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <MicrosoftIcon />
              <span>Sign in with Microsoft</span>
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
```

### Step 12: Protected Page Example

**File:** `pages/index.js` (Dashboard)

```javascript
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
        </div>
      </main>
    </div>
  );
}
```

---

## Testing Checklist

### Authentication Flow

- [ ] **Login**
  - [ ] Google OAuth popup opens
  - [ ] Microsoft OAuth popup opens
  - [ ] User can authenticate with Google
  - [ ] User can authenticate with Microsoft
  - [ ] ID token is sent to server
  - [ ] Session cookie is created
  - [ ] User is redirected to dashboard
  - [ ] User state is available in context
  - [ ] Separate loading states for each provider
  - [ ] Buttons are disabled during any sign-in process

- [ ] **Session Persistence**
  - [ ] Session persists on page refresh
  - [ ] Session persists across navigation
  - [ ] Session cookie is HttpOnly and Secure
  - [ ] Session expires after 14 days

- [ ] **Logout**
  - [ ] Manual logout clears session
  - [ ] Firebase tokens are revoked
  - [ ] Session cookie is cleared
  - [ ] User is redirected to login
  - [ ] User state is cleared

### Inactivity Timer

- [ ] **Timer Initialization**
  - [ ] Timer starts when user logs in
  - [ ] Timer stops when user logs out
  - [ ] No timers when user is null

- [ ] **Activity Detection**
  - [ ] Click events reset timer
  - [ ] Scroll events reset timer
  - [ ] Keyboard events reset timer
  - [ ] Mouse events reset timer

- [ ] **Warning Modal**
  - [ ] Modal appears at 29 minutes
  - [ ] Countdown starts at 60 seconds
  - [ ] Countdown decreases every second
  - [ ] Visual countdown circle updates

- [ ] **Modal Interaction**
  - [ ] Background is blocked when modal open
  - [ ] Body scroll is disabled
  - [ ] Keyboard events are blocked
  - [ ] "I'm Still Here" button works
  - [ ] Timer resets when button clicked

- [ ] **Auto Logout**
  - [ ] Logout occurs when countdown reaches 0
  - [ ] Logout occurs at 30 minutes (safety net)
  - [ ] Session is cleared on auto-logout
  - [ ] User is redirected to login

### Route Protection

- [ ] **Proxy (Route Protection)**
  - [ ] Protected routes redirect to login without session
  - [ ] Login page redirects to dashboard with session
  - [ ] Redirect parameter is preserved
  - [ ] API routes are excluded from proxy

- [ ] **Protected Pages**
  - [ ] Show loading spinner while initializing
  - [ ] Redirect to login if not authenticated
  - [ ] Display content when authenticated

### Error Handling

- [ ] **Network Errors**
  - [ ] Login fails gracefully on network error
  - [ ] Error message is displayed
  - [ ] User can retry login

- [ ] **Invalid Tokens**
  - [ ] Invalid ID token returns 401
  - [ ] Invalid session cookie redirects to login
  - [ ] Error messages are user-friendly

- [ ] **Edge Cases**
  - [ ] Multiple tabs stay in sync
  - [ ] Page refresh during countdown
  - [ ] Concurrent logout attempts
  - [ ] Timer cleanup on unmount

### Performance

- [ ] **Memory Leaks**
  - [ ] All timers are cleared on unmount
  - [ ] Event listeners are removed
  - [ ] No console warnings

- [ ] **Performance**
  - [ ] No unnecessary re-renders
  - [ ] Context updates are optimized
  - [ ] Modal doesn't block main thread

---

## Environment Variables

### Client-Side (.env.local)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Server-Side (.env.local)

```bash
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

### Getting Firebase Credentials

1. **Client Config**: Firebase Console → Project Settings → General → Your apps
2. **Admin SDK**: Firebase Console → Project Settings → Service Accounts → Generate New Private Key

---

## Implementation Order Summary

1. ✅ Set up environment variables
2. ✅ Create `lib/firebase.js` (Client SDK)
3. ✅ Create `lib/firebaseAdmin.js` (Admin SDK)
4. ✅ Create `hooks/useInactivityTimer.js`
5. ✅ Create `context/AuthContext.js` (with Google & Microsoft sign-in)
6. ✅ Create `components/Icons.js` (Google, Microsoft, Spinner icons)
7. ✅ Create `components/InactivityWarningModal.js`
8. ✅ Create `pages/api/auth/session.js`
9. ✅ Create `pages/api/auth/logout.js`
10. ✅ Create `proxy.js`
11. ✅ Update `pages/_app.js`
12. ✅ Create `pages/login/index.js` (with both sign-in options)
13. ✅ Update protected pages (add `initializing` check)

---

## Notes

- **Session Cookie Security**: Always use HttpOnly, Secure, and SameSite=Lax
- **Token Revocation**: Always revoke Firebase tokens on logout for security
- **Timer Cleanup**: Always clear timers and remove event listeners in cleanup
- **State Management**: Use refs for values that don't need to trigger re-renders
- **Error Handling**: Always handle errors gracefully with user-friendly messages
- **DRY Principle**: Use generic sign-in handler for multiple OAuth providers to avoid code duplication
- **Separate Loading States**: Use separate loading states for each OAuth provider (`signingInGoogle`, `signingInMicrosoft`) for better UX
- **Adding More Providers**: To add more OAuth providers (e.g., GitHub, Facebook), create a provider instance and call `handleSignIn` (see AuthContext.js for pattern)
- **Testing**: Test in multiple browsers and devices
- **Production**: Change inactivity timers back to production values (29 min / 60 sec / 30 min)

---

## Support

For issues or questions:
1. Check Firebase Console for authentication errors
2. Check browser console for client-side errors
3. Check server logs for API route errors
4. Verify environment variables are set correctly
5. Ensure Firebase Admin SDK credentials are valid

---

**Last Updated:** [Current Date]
**Version:** 1.0.0

