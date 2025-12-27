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


