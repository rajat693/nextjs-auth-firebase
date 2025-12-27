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