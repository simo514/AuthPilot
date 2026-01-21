# AuthPilot - Deployment Guide

## 🚀 Render Deployment (Backend)

### Prerequisites
- Render account
- MongoDB Atlas database (or other hosted MongoDB)
- Redis instance (Upstash, Redis Cloud, or Render Redis)

### Deployment Steps

1. **Create New Web Service on Render**
   - Connect your GitHub repository
   - Select the `server` folder as root directory

2. **Configure Build & Start Commands**
   ```
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Environment Variables** (Add in Render Dashboard)
   ```
   NODE_ENV=production
   PORT=3000
   
   # Database
   DB_CONNECTION=mongodb+srv://user:pass@cluster.mongodb.net/authpilot
   
   # Redis (Get from Upstash or Redis Cloud)
   REDIS_HOST=your-redis-host.com
   REDIS_PORT=6379
   REDIS_PASSWORD=your_redis_password
   
   # JWT Secrets (Generate with: openssl rand -base64 32)
   JWT_SECRET=your_production_jwt_secret
   JWT_REFRESH_SECRET=your_production_refresh_secret
   
   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=https://your-app.onrender.com/auth/google/callback
   
   # Frontend URL (Your Vercel domain)
   FRONTEND_URL=https://your-app.vercel.app
   
   # CORS Origins (Comma-separated)
   CORS_ORIGINS=https://your-app.vercel.app,https://www.your-app.com
   ```

4. **Health Check**
   - Render will automatically use `/health` endpoint

---

## 🌐 Vercel Deployment (Frontend)

### Prerequisites
- Vercel account
- Backend deployed and running

### Deployment Steps

1. **Create New Project on Vercel**
   - Import your GitHub repository
   - Select the `client` folder as root directory

2. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Environment Variables** (Add in Vercel Dashboard)
   ```
   VITE_API_URL=https://your-backend.onrender.com
   VITE_APP_NAME=AuthPilot
   VITE_APP_VERSION=1.0.0
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically redeploy on git push

---

## ✅ Post-Deployment Checklist

### Backend (Render)
- [ ] Health check endpoint responding: `https://your-app.onrender.com/health`
- [ ] MongoDB connection successful
- [ ] Redis connection successful
- [ ] JWT authentication working
- [ ] CORS configured correctly for frontend domain
- [ ] Google OAuth callback URL updated (if using)

### Frontend (Vercel)
- [ ] Application loads correctly
- [ ] Can login/signup
- [ ] API calls working to backend
- [ ] Routing works (SPA navigation)
- [ ] No console errors

### Security
- [ ] All environment variables set
- [ ] HTTPS enforced (automatic on Vercel/Render)
- [ ] CORS origins restricted to your domains
- [ ] JWT secrets are strong and unique
- [ ] Database connection string secured

---

## 🔧 Common Issues

### CORS Errors
- Ensure `CORS_ORIGINS` includes your Vercel domain
- Don't include trailing slashes
- Include both www and non-www if needed

### Cookie Issues
- Render/Vercel use HTTPS - cookies will work
- SameSite=None with Secure if cross-domain

### Database Connection
- Whitelist Render's IP or use 0.0.0.0/0 in MongoDB Atlas
- Test connection string locally first

### 404 on Frontend Routes
- `vercel.json` is configured for SPA routing
- All routes redirect to index.html

---

## 📊 Monitoring

### Render
- Check Logs in Render Dashboard
- Set up health check monitoring
- Monitor resource usage

### Vercel
- Analytics tab shows traffic
- Check deployment logs for build errors
- Monitor function execution time

---

## 🔄 Continuous Deployment

Both Render and Vercel will automatically redeploy when you push to your main branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

---

## 💰 Cost Optimization

### Free Tier Limits
- **Render**: 750 hours/month (sufficient for 1 service)
- **Vercel**: Unlimited deployments, 100GB bandwidth
- **MongoDB Atlas**: 512MB free tier
- **Upstash Redis**: 10k commands/day free

### Tips
- Use Render's auto-sleep feature for dev environments
- Optimize bundle size to reduce bandwidth
- Use Redis for caching to reduce database calls
