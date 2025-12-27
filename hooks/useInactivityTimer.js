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

