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
