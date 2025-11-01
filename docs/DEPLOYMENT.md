# TaskSync Deployment Guide

This guide covers deploying TaskSync to production environments.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Backend Deployment (Railway)](#backend-deployment-railway)
- [Frontend Deployment (Expo EAS)](#frontend-deployment-expo-eas)
- [Database Setup (MongoDB Atlas)](#database-setup-mongodb-atlas)
- [Environment Variables](#environment-variables)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Accounts

- ✅ [GitHub](https://github.com) account
- ✅ [Railway](https://railway.app) account (backend hosting)
- ✅ [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (database)
- ✅ [Expo](https://expo.dev) account (mobile app distribution)

### Required Tools

```bash
# Node.js and npm
node --version  # v18 or higher
npm --version   # v8 or higher

# Python
python --version  # 3.10 or higher

# Expo CLI (optional but recommended)
npm install -g eas-cli

# Git
git --version
```

---

## Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. **Sign up/Login** to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

2. **Create a New Cluster**
   - Click "Build a Database"
   - Choose "Shared" (Free tier) or "Dedicated" for production
   - Select your cloud provider (AWS recommended)
   - Choose a region closest to your backend server
   - Cluster Name: `tasksync-cluster`

3. **Configure Security**
   
   **Database Access:**
   - Click "Database Access" in left sidebar
   - Click "Add New Database User"
   - Username: `tasksync_admin`
   - Password: Generate strong password (save it!)
   - Database User Privileges: "Atlas admin"
   - Click "Add User"

   **Network Access:**
   - Click "Network Access" in left sidebar
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

4. **Get Connection String**
   - Click "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Driver: Python, Version: 3.12 or later
   - Copy the connection string:
   ```
   mongodb+srv://tasksync_admin:<password>@tasksync-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password

5. **Create Database**
   - Click "Browse Collections"
   - Click "Add My Own Data"
   - Database name: `tasksync_production`
   - Collection name: `users`
   - Click "Create"

### Step 2: Create Indexes

Connect to your database using MongoDB Compass or shell:

```javascript
// Users collection
db.users.createIndex({ "email": 1 }, { unique: true })

// Tasks collection
db.tasks.createIndex({ "user_id": 1 })
db.tasks.createIndex({ "user_id": 1, "completed": 1 })
db.tasks.createIndex({ "user_id": 1, "due_date": 1 })
```

---

## Backend Deployment (Railway)

### Step 1: Prepare Repository

1. **Ensure .gitignore is configured**
   ```bash
   # Should already include
   .env
   .env.local
   __pycache__/
   .venv/
   ```

2. **Commit your code**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

### Step 2: Deploy to Railway

1. **Sign up/Login** to [Railway](https://railway.app)

2. **Create New Project**
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select your repository: `Tasksync`

3. **Configure Service**
   - Railway will detect it's a Python project
   - Root Directory: `/backend`
   - Build Command: (auto-detected from requirements.txt)
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

4. **Set Environment Variables**
   
   Go to your project settings → Variables:
   
   ```env
   MONGO_URL=mongodb+srv://tasksync_admin:YOUR_PASSWORD@tasksync-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   DB_NAME=tasksync_production
   JWT_SECRET_KEY=<generate-strong-secret-key>
   JWT_ALGORITHM=HS256
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

   **Generate a strong JWT secret:**
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

5. **Deploy**
   - Railway will automatically deploy
   - Wait for build to complete (~2-3 minutes)
   - Your API will be available at: `https://your-app.up.railway.app`

6. **Test Deployment**
   ```bash
   curl https://your-app.up.railway.app/api/health
   ```

### Step 3: Configure Custom Domain (Optional)

1. **In Railway Settings**
   - Go to Settings → Domains
   - Click "Generate Domain"
   - Or add your custom domain

2. **Update DNS Records** (if using custom domain)
   ```
   Type: CNAME
   Name: api
   Value: your-app.up.railway.app
   ```

---

## Frontend Deployment (Expo EAS)

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

### Step 3: Configure EAS Build

1. **Initialize EAS**
   ```bash
   cd frontend
   eas build:configure
   ```

2. **Update app.json** with your backend URL:
   ```json
   {
     "expo": {
       "extra": {
         "EXPO_PUBLIC_BACKEND_URL": "https://your-app.up.railway.app"
       }
     }
   }
   ```

3. **Create eas.json** (if not exists):
   ```json
   {
     "cli": {
       "version": ">= 5.0.0"
     },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal"
       },
       "preview": {
         "distribution": "internal",
         "android": {
           "buildType": "apk"
         }
       },
       "production": {
         "android": {
           "buildType": "apk"
         }
       }
     },
     "submit": {
       "production": {}
     }
   }
   ```

### Step 4: Build for Android

```bash
# Production build
eas build --platform android --profile production

# Preview build (APK for testing)
eas build --platform android --profile preview
```

This will:
- Upload your code to Expo servers
- Build the APK/AAB file
- Provide download link when complete (~10-20 minutes)

### Step 5: Build for iOS

```bash
eas build --platform ios --profile production
```

**Note**: iOS builds require:
- Apple Developer Account ($99/year)
- iOS distribution certificates
- App Store Connect access

### Step 6: Submit to Stores

#### Google Play Store

1. **Create App in Play Console**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create new app: "TaskSync"
   - Fill in required information

2. **Submit via EAS**
   ```bash
   eas submit --platform android
   ```

#### Apple App Store

1. **Create App in App Store Connect**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create new app
   - Fill in required information

2. **Submit via EAS**
   ```bash
   eas submit --platform ios
   ```

### Step 7: Over-the-Air (OTA) Updates

For quick updates without rebuilding:

```bash
# Install expo-updates if not already
npm install expo-updates

# Publish update
eas update --branch production --message "Bug fixes and improvements"
```

---

## Environment Variables

### Backend (.env)

```env
# Database
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=tasksync_production

# JWT Configuration
JWT_SECRET_KEY=<your-super-secret-key-minimum-32-characters>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Server Configuration (Railway auto-provides)
PORT=8000
```

### Frontend (app.json)

```json
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_BACKEND_URL": "https://your-backend-url.up.railway.app"
    }
  }
}
```

---

## CI/CD Pipeline

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run tests
        run: |
          cd backend
          pytest
      
      - name: Deploy to Railway
        run: |
          # Railway auto-deploys on push to main
          echo "Deployment triggered"
```

### Auto-Deploy Configuration

**Railway:**
- Auto-deploys on git push to main
- Configurable in project settings

**Expo EAS:**
- Set up GitHub Actions for automatic builds
- Example workflow:

```yaml
name: Build Mobile App

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      
      - name: Build Android
        run: |
          cd frontend
          eas build --platform android --profile production --non-interactive
```

---

## Monitoring & Maintenance

### Backend Monitoring

**Railway Monitoring:**
- CPU usage
- Memory usage
- Request logs
- Deployment history

**Custom Logging:**

Add to `server.py`:
```python
from fastapi.middleware.httpslogging import HTTPLoggingMiddleware

app.add_middleware(
    HTTPLoggingMiddleware,
    log_level="INFO"
)
```

### Database Monitoring

**MongoDB Atlas:**
- Performance Advisor
- Real-time metrics
- Slow query analysis
- Storage usage

### Error Tracking (Optional)

**Sentry Integration:**

```bash
pip install sentry-sdk[fastapi]
```

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)
```

### Uptime Monitoring

Use services like:
- **UptimeRobot** (free)
- **Pingdom**
- **StatusCake**

Monitor endpoint: `https://your-api.up.railway.app/api/health`

---

## Backup Strategy

### Database Backups

**MongoDB Atlas:**
- Automatic backups enabled by default
- Point-in-time recovery available (M10+)
- Manual snapshots via Atlas UI

**Manual Backup:**
```bash
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/tasksync_production" --out=/backup/
```

### Code Backups

- Git repository (GitHub)
- Railway deployment history
- EAS build artifacts

---

## Scaling Strategies

### Vertical Scaling

**Railway:**
1. Go to project settings
2. Increase memory/CPU allocation
3. Restart service

**MongoDB Atlas:**
1. Go to cluster settings
2. Select higher tier (M10, M20, etc.)
3. Apply changes

### Horizontal Scaling

**Multiple Railway Instances:**
1. Create new service
2. Point to same database
3. Use load balancer

**MongoDB Sharding:**
- Available on M30+ clusters
- Configure via Atlas UI
- Define shard key (user_id recommended)

---

## SSL/HTTPS Configuration

### Railway

- HTTPS automatically enabled
- Free SSL certificates
- Auto-renewal

### Custom Domain SSL

If using custom domain:
- Railway provides free SSL
- Automatic certificate generation
- No configuration needed

---

## Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check Railway logs
railway logs

# Common fixes:
# 1. Check environment variables
# 2. Verify MongoDB connection string
# 3. Check Python version compatibility
```

**Database connection fails:**
```bash
# Test connection locally
python -c "
from pymongo import MongoClient
client = MongoClient('your-connection-string')
print(client.server_info())
"
```

**Mobile app can't connect:**
```bash
# Verify backend URL in app.json
# Test API manually
curl https://your-api.up.railway.app/api/health

# Check CORS configuration in server.py
```

---

## Security Checklist

- [ ] HTTPS enabled (automatic with Railway)
- [ ] Strong JWT secret key (32+ characters)
- [ ] MongoDB IP whitelist configured
- [ ] Environment variables not committed to Git
- [ ] CORS configured for specific origins in production
- [ ] Rate limiting enabled (optional)
- [ ] Error messages don't expose sensitive info
- [ ] Database backups enabled
- [ ] Monitoring and alerting set up

---

## Production Checklist

### Backend
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] CORS configured for production domains
- [ ] Logging enabled
- [ ] Error tracking set up (Sentry)
- [ ] Health check endpoint working
- [ ] API documentation accessible (/docs)

### Frontend
- [ ] Backend URL updated in app.json
- [ ] App icons and splash screen configured
- [ ] App permissions correctly set
- [ ] Privacy policy URL added
- [ ] Terms of service URL added
- [ ] Contact email configured
- [ ] App version incremented

### Infrastructure
- [ ] MongoDB backups enabled
- [ ] Uptime monitoring configured
- [ ] Domain SSL certificate active
- [ ] CDN configured (if needed)
- [ ] Analytics integrated (if needed)

---

## Post-Deployment

### Verify Deployment

```bash
# Test health endpoint
curl https://your-api.up.railway.app/api/health

# Test registration
curl -X POST https://your-api.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"test123"}'

# Download mobile app from EAS
# Test on real device
```

### Monitor First 24 Hours

- Check error rates
- Monitor response times
- Watch for crashes
- Review user feedback

---

## Support

For deployment issues:
- Railway: [railway.app/help](https://railway.app/help)
- MongoDB Atlas: [support.mongodb.com](https://support.mongodb.com)
- Expo: [expo.dev/support](https://expo.dev/support)
- GitHub Issues: [github.com/saurabh-eg/Tasksync/issues](https://github.com/saurabh-eg/Tasksync/issues)

---

**Congratulations! Your TaskSync app is now deployed! 🎉**
