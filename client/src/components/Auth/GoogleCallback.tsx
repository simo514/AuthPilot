import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Shield } from 'lucide-react';

export function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleGoogleCallback } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      // The backend should redirect here with the tokens
      // But since it's a GET request, we need to handle it differently
      // Option 1: Extract tokens from URL params (not secure)
      // Option 2: Let backend set the cookie and redirect to a success page
      
      // For now, let's assume backend handles the redirect after setting cookies
      // and we just need to fetch user data
      
      try {
        // The backend already set the tokens in cookies and returned JSON
        // We need to parse the response from the URL or use a different approach
        
        // Better approach: Create a temporary route that backend redirects to
        // with user data in URL params (encoded) or session
        const accessToken = searchParams.get('accessToken');
        const userDataEncoded = searchParams.get('user');
        
        if (accessToken && userDataEncoded) {
          const user = JSON.parse(decodeURIComponent(userDataEncoded));
          handleGoogleCallback(accessToken, user);
          navigate('/dashboard');
        } else {
          // Fallback: redirect to login with error
          navigate('/login?error=google_auth_failed');
        }
      } catch (error) {
        console.error('Google callback error:', error);
        navigate('/login?error=google_auth_failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate, handleGoogleCallback]);

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
