# Google OAuth - Quick Start Guide

## ✅ What Was Implemented

### Backend Changes:
1. **Google Strategy** (`google.strategy.ts`) - Handles Google OAuth authentication
2. **Auth Module** - Added GoogleStrategy provider
3. **Auth Controller** - Added two endpoints:
   - `GET /auth/google` - Initiates OAuth flow
   - `GET /auth/google/callback` - Handles OAuth callback
4. **Auth Service** - Added `googleLogin()` method
5. **User Schema** - Added `googleId` and `picture` fields
6. **Users Service** - Added helper methods for Google OAuth

### Frontend Changes:
1. **GoogleAuthButton Component** - Reusable button with Google branding
2. **GoogleCallback Component** - Handles OAuth redirect
3. **Login Page** - Added Google sign-in button
4. **Signup Page** - Added Google sign-up button
5. **Auth Store** - Added `loginWithGoogle()` and `handleGoogleCallback()` methods
6. **App Router** - Added `/auth/google/callback` route

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install passport-google-oauth20 @types/passport-google-oauth20
```

### 2. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
4. Copy Client ID and Client Secret

### 3. Environment Variables

Add to your `server/.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

### 4. Start Both Servers

```bash
# Terminal 1 - Backend
cd server
npm run start:dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 5. Test It Out

1. Open `http://localhost:5173/login`
2. Click "Sign in with Google"
3. Complete Google authentication
4. You'll be redirected to the dashboard!

## 🔄 How It Works

```
User clicks "Sign in with Google"
    ↓
Frontend redirects to → /auth/google
    ↓
Backend redirects to → Google OAuth Consent Screen
    ↓
User approves permissions
    ↓
Google redirects to → /auth/google/callback (backend)
    ↓
Backend:
  - Validates Google token
  - Creates/updates user in database
  - Generates JWT tokens
  - Redirects to → /auth/google/callback?accessToken=xxx&user=xxx (frontend)
    ↓
Frontend:
  - Extracts tokens from URL
  - Sets auth state
  - Redirects to dashboard
```

## 📝 Key Features

- ✅ New users are automatically created with Google OAuth
- ✅ Existing users can link their Google account
- ✅ Google profile picture is stored
- ✅ Refresh tokens stored in HttpOnly cookies
- ✅ Access tokens managed in memory
- ✅ Same authorization system applies (roles, permissions)
- ✅ Works with existing login/signup flow

## 🔒 Security Notes

- Refresh tokens stored in HttpOnly cookies (secure)
- Access tokens passed via URL redirect (consider server-side session for production)
- CORS configured for frontend origin
- OAuth state parameter handled by Passport
- Token expiration: Access (1 hour), Refresh (7 days)

## 🎨 UI Preview

The Google buttons appear on both login and signup pages with:
- Google branding (4-color logo)
- Clear "Or continue with" divider
- Responsive design
- Dark mode support
- Disabled state during loading

## 📚 Additional Resources

- Full setup guide: `GOOGLE_OAUTH_SETUP.md`
- Google OAuth Docs: https://developers.google.com/identity/protocols/oauth2
- Passport Google Strategy: http://www.passportjs.org/packages/passport-google-oauth20/
