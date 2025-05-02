"use client";

import { ReactNode, useEffect, useState } from "react";

interface FirebaseProviderProps {
  children: ReactNode;
}

/**
 * FirebaseProvider component to detect Firebase connectivity issues
 * and display warnings to users
 */
export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Add error detection for Firebase connection issues
    const handleError = (e: ErrorEvent) => {
      const errorMsg = e.message || '';
      if (
        errorMsg.includes('net::ERR_BLOCKED_BY_CLIENT') ||
        errorMsg.includes('failed to fetch') ||
        errorMsg.includes('Network Error')
      ) {
        setError('Firebase connection issue detected. This may be caused by an ad blocker.');
      }
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Display warning if error is detected
  return (
    <>
      {error && (
        <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 p-3 rounded-md shadow-md max-w-sm z-50">
          <h4 className="font-medium text-sm text-yellow-800">Firebase Connection Issue</h4>
          <p className="text-xs text-yellow-700 mt-1">
            There was an issue connecting to the database. Some features may not work correctly.
            If you're using an ad blocker, please disable it for this site.
          </p>
          <button 
            onClick={() => setError(null)}
            className="text-xs text-blue-600 mt-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}
      {children}
    </>
  );
}

export default FirebaseProvider; 