# Testing Google OAuth Integration

## Prerequisites Checklist

Before testing, ensure you have:

- [ ] Installed `passport-google-oauth20` package in server
- [ ] Created Google OAuth credentials
- [ ] Added redirect URI in Google Console: `http://localhost:3000/auth/google/callback`
- [ ] Set environment variables in server/.env:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALLBACK_URL`
  - `FRONTEND_URL`
- [ ] Both servers running (backend on :3000, frontend on :5173)

## Test Scenarios

### 1. New User Registration via Google

**Steps:**
1. Go to `http://localhost:5173/signup`
2. Click "Sign up with Google"
3. Select a Google account (use one not registered in the system)
4. Approve permissions
5. Should redirect to dashboard

**Expected Result:**
- ✅ User created in database with Google ID
- ✅ Default "user" role assigned
- ✅ Profile picture saved
- ✅ Redirected to dashboard
- ✅ Can access user features

**Verify in Database:**
```javascript
// MongoDB
db.users.findOne({ email: "your-google-email@gmail.com" })
// Should have: googleId, picture, role: "user"
```

---

### 2. Existing User Login via Google

**Steps:**
1. First, register normally: `http://localhost:5173/signup` with email/password
2. Logout
3. Go to `http://localhost:5173/login`
4. Click "Sign in with Google"
5. Use the SAME Google email from step 1
6. Approve permissions

**Expected Result:**
- ✅ Existing account linked with Google ID
- ✅ Logged in successfully
- ✅ Original role preserved
- ✅ Dashboard matches user's role

---

### 3. Login Page Google Button

**Steps:**
1. Go to `http://localhost:5173/login`
2. Verify "Sign in with Google" button is visible
3. Click the button

**Expected Result:**
- ✅ Button shows Google colors (🔴🟡🔵🟢)
- ✅ Redirects to Google OAuth screen
- ✅ Works in both light and dark mode

---

### 4. Signup Page Google Button

**Steps:**
1. Go to `http://localhost:5173/signup`
2. Verify "Sign up with Google" button is visible
3. Click the button

**Expected Result:**
- ✅ Button shows "Sign up with Google"
- ✅ Same flow as login (Google doesn't distinguish)
- ✅ New users created, existing users logged in

---

### 5. Callback Handling

**Steps:**
1. Initiate Google login
2. Watch the URL after Google approval

**Expected URL Flow:**
```
1. http://localhost:5173/login
2. http://localhost:3000/auth/google
3. https://accounts.google.com/...
4. http://localhost:3000/auth/google/callback
5. http://localhost:5173/auth/google/callback?accessToken=xxx&user=xxx
6. http://localhost:5173/dashboard
```

**Expected Result:**
- ✅ Smooth redirect chain
- ✅ No errors in console
- ✅ Tokens set correctly
- ✅ User authenticated

---

### 6. Session Persistence

**Steps:**
1. Login via Google
2. Refresh the page
3. Close and reopen browser
4. Navigate to `http://localhost:5173/dashboard`

**Expected Result:**
- ✅ Still logged in after refresh
- ✅ Session persists across browser restarts
- ✅ Access token refreshed automatically

---

### 7. Error Handling

#### Test: User denies permissions

**Steps:**
1. Click "Sign in with Google"
2. On Google consent screen, click "Cancel"

**Expected Result:**
- ✅ Redirected back to login
- ✅ Error message shown (optional)
- ✅ No crash or broken state

#### Test: Invalid credentials

**Steps:**
1. Set wrong `GOOGLE_CLIENT_ID` in .env
2. Try to login with Google

**Expected Result:**
- ✅ Backend logs error
- ✅ User sees error page or redirect to login
- ✅ No sensitive error details exposed

---

### 8. Role-Based Access

**Steps:**
1. Login via Google (creates user with "user" role)
2. Try to access `/users` (requires admin permissions)

**Expected Result:**
- ✅ Redirected to unauthorized page
- ✅ Same RBAC rules apply as normal login
- ✅ Google users not given special privileges

---

### 9. Multiple Account Linking

**Steps:**
1. Create account: user1@gmail.com (traditional signup)
2. Logout
3. Login with Google using user1@gmail.com
4. Logout
5. Login with traditional email/password (user1@gmail.com)

**Expected Result:**
- ✅ Both login methods work for same account
- ✅ User data consistent
- ✅ Google ID field populated after Google login

---

### 10. Profile Picture

**Steps:**
1. Login via Google
2. Go to Settings/Profile page
3. Check if Google profile picture is displayed

**Expected Result:**
- ✅ Picture URL stored in database
- ✅ Picture displayed in UI (if implemented)

**Database Check:**
```javascript
db.users.findOne({ email: "user@gmail.com" }, { picture: 1 })
// Should return: { picture: "https://lh3.googleusercontent.com/..." }
```

---

## Troubleshooting

### Issue: "redirect_uri_mismatch"
**Solution:** 
- Ensure `GOOGLE_CALLBACK_URL` matches EXACTLY what's in Google Console
- Check for trailing slashes
- Verify http vs https

### Issue: "invalid_client"
**Solution:**
- Double-check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Ensure .env file is loaded correctly
- Restart backend server

### Issue: User created but no Google ID
**Solution:**
- Check backend logs for errors
- Verify `googleLogin()` method is called
- Ensure `createUserWithGoogle()` or `updateGoogleId()` is working

### Issue: Frontend not redirecting after OAuth
**Solution:**
- Check `FRONTEND_URL` in backend .env
- Verify `/auth/google/callback` route exists in frontend
- Check browser console for errors
- Ensure tokens are being extracted from URL params

### Issue: "Cannot read properties of undefined"
**Solution:**
- Verify `handleGoogleCallback` is defined in auth store
- Check that GoogleCallback component is properly imported
- Ensure URL params contain `accessToken` and `user`

---

## Success Criteria

All tests pass if:
- ✅ New users can register via Google
- ✅ Existing users can login via Google
- ✅ Account linking works correctly
- ✅ UI buttons display properly
- ✅ OAuth flow completes without errors
- ✅ Sessions persist correctly
- ✅ RBAC rules apply to Google users
- ✅ Error handling works gracefully

---

## Production Checklist

Before deploying to production:
- [ ] Update `GOOGLE_CALLBACK_URL` to production URL
- [ ] Update `FRONTEND_URL` to production URL
- [ ] Add production redirect URI in Google Console
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (required for production OAuth)
- [ ] Configure CORS for production domain
- [ ] Test OAuth flow on production
- [ ] Monitor logs for OAuth errors
- [ ] Set up error alerting

---

## Monitoring

**Key Metrics to Track:**
- Google OAuth success rate
- Failed authentication attempts
- New user signups via Google
- Account linking events
- OAuth callback errors

**Log Messages to Watch:**
```
✅ "User created via Google OAuth: email"
✅ "Google ID linked to user: uuid"
✅ "Google OAuth login successful: email"
❌ "Google OAuth user validated: null"
❌ "Failed to retrieve or create user"
```
