# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your application.

## Prerequisites

1. A Google Cloud Platform account
2. Node.js and npm installed

## Step 1: Install Required Packages

```bash
npm install passport-google-oauth20 @types/passport-google-oauth20
```

## Step 2: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/auth/google/callback`
     - For production: `https://yourdomain.com/auth/google/callback`
   - Click "Create"
   - Copy your Client ID and Client Secret

## Step 3: Configure Environment Variables

Add the following variables to your `.env` file in the **server** directory:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:5173
```

For production, update both `GOOGLE_CALLBACK_URL` and `FRONTEND_URL` to your production URLs.

## Step 4: Frontend Setup

The frontend has been configured with Google OAuth integration. Here's what was added:

### New Components:
1. **GoogleAuthButton** - Reusable Google sign-in button
2. **GoogleCallback** - Handles the OAuth callback redirect

### Updated Components:
1. **Login.tsx** - Added "Sign in with Google" button
2. **Signup.tsx** - Added "Sign up with Google" button
3. **App.tsx** - Added `/auth/google/callback` route

### Auth Store Methods:
- `loginWithGoogle()` - Redirects to backend Google OAuth endpoint
- `handleGoogleCallback()` - Processes the OAuth response and sets user session

### Flow:
1. User clicks "Sign in with Google"
2. Frontend redirects to `http://localhost:3000/auth/google`
3. Google OAuth consent screen appears
4. After approval, Google redirects to backend callback
5. Backend processes authentication and redirects to frontend callback route
6. Frontend extracts tokens and user data, sets auth state
7. User is redirected to dashboard

## Step 5: Test the Integration

### Using the UI:

1. Start both backend and frontend servers:
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run start:dev
   
   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```
 Backend then redirects to frontend callback route.

3. **Frontend Callback Route:**
   ```
   GET http://localhost:5173/auth/google/callback
   ```
   Frontend processes the OAuth response and completes authentication.

### Manual Testing (Browser Only)utton
4. Complete Google OAuth flow
5. You should be redirected to the dashboard

### Backend API Endpoints

1. **Initiate Google OAuth Flow:**
   ```
   GET http://localhost:3000/auth/google
   ```
   This redirects the user to Google's login page.

2. **Callback Endpoint:**
   ```
   GET http://localhost:3000/auth/google/callback
   ```
   Google redirects here after authentication.

### Code Implementation Reference

The Google OAuth button in the frontend:

```tsx
// In Login.tsx or Signup.tsx
import { useAuthStore } from '../../store/useAuthStore';
import { GoogleAuthButton } from './GoogleAuthButton';

const { loginWithGoogle } = useAuthStore();

const handleGoogleLogin = () => {
  loginWithGoogle();
};

// In the render
<GoogleAuthButton mode="login" onClick={handleGoogleLogin} />
```

The auth store method:

```typescript
loginWithGoogle: () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  window.location.href = `${API_BASE_URL}/auth/google`;
}
```

## Step 6: User Flow

1. User clicks "Login with Google"
2. User is redirected to Google's OAuth consent screen
3. User grants permissions
4. Google redirects back to your callback URL
5. Backend:
   - Validates the Google OAuth token
   - Creates a new user if they don't exist
   - Links Google account if user exists with the same email
   - Generates JWT tokens (access & refresh)
   - Returns tokens and user data

## Database Schema Changes

The following fields were added to the User schema:

```typescript
@Prop({
  type: String,
  default: null,
  unique: true,
  sparse: true, // Allows null values while maintaining uniqueness
})
googleId: string;

@Prop({
  type: String,
  default: null,
})
picture: string;
```

## Security Considerations

1. **HTTPS in Production:** Always use HTTPS in production environments
2. **Secure Cookies:** Refresh tokens are stored in HttpOnly cookies
3. **CORS Configuration:** Ensure your CORS settings allow requests from your frontend domain
4. **Token Expiration:** Access tokens expire in 1 hour, refresh tokens in 7 days
5. **Redis Sessions:** Refresh tokens are stored in Redis with TTL for session management

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Ensure the redirect URI in Google Console exactly matches your callback URL
- Check for trailing slashes and protocol (http vs https)

### Error: "invalid_client"
- Verify your Client ID and Client Secret are correct
- Ensure environment variables are loaded properly

### Error: "access_denied"
- User denied permissions on Google's consent screen
- Check that Google+ API is enabled

## Testing with Postman/cURL

You cannot directly test OAuth with Postman as it requires browser redirects. Instead:

1. Open browser and go to: `http://localhost:3000/auth/google`
2. Complete the OAuth flow
3. Check the response containing `accessToken` and `user` data
4. Use the `accessToken` for subsequent API requests:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/users
```

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Update `GOOGLE_CALLBACK_URL` to production URL
- [ ] Add production domain to Google OAuth authorized redirect URIs
- [ ] Enable HTTPS
- [ ] Configure CORS for your production domain
- [ ] Set secure cookie options
- [ ] Monitor Redis for session storage
- [ ] Implement rate limiting (already configured with Throttler)
