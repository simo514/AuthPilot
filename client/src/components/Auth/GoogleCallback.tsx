import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Shield } from 'lucide-react';

export function GoogleCallback() {
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuthStore();

  useEffect(() => {
    const completeGoogleAuth = async () => {
      try {
        // Backend has set the refresh token in httpOnly cookie
        // Now we need to get the access token and user info
        await handleGoogleCallback();
        
        // Navigate to dashboard on success
        navigate('/');
      } catch (error) {
        console.error('Google callback error:', error);
        navigate('/login?error=google_auth_failed');
      }
    };

    completeGoogleAuth();
  }, [navigate, handleGoogleCallback]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <Shield className="h-16 w-16 text-blue-600 dark:text-blue-400 animate-pulse mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Completing Google Sign In...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we authenticate your account.
        </p>
      </div>
    </div>
  );
}
