import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Login } from './Login';
import { Signup } from './Signup';
import { useAuthStore } from '../../store/useAuthStore';

interface AuthPageProps {
  isSignup?: boolean;
}

export function AuthPage({ isSignup = false }: AuthPageProps) {
  const [isSignupMode, setIsSignupMode] = useState(isSignup);
  const { isAuthenticated } = useAuthStore();

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return isSignupMode ? (
    <Signup onToggleMode={() => setIsSignupMode(false)} />
  ) : (
    <Login onToggleMode={() => setIsSignupMode(true)} />
  );
}
