# 🚀 Zyra Startup Guide - Fix Project Creation Issues

## 📋 Prerequisites Check

Before starting Zyra, ensure these services are running:

### 1. **Redis Server**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running, start Redis:
brew services start redis
```

### 2. **Database Migrations**
```bash
cd /Users/jadenryu/Documents/zyra/backend

# Run database migrations
alembic upgrade head
```

### 3. **Backend Server**
```bash
cd /Users/jadenryu/Documents/zyra/backend

# Activate virtual environment (if needed)
source venv/bin/activate

# Install dependencies (if needed)
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. **Frontend Server**
```bash
cd /Users/jadenryu/Documents/zyra/frontend

# Install dependencies (if needed)
npm install

# Start frontend server
npm run dev
```

## 🔧 Troubleshooting Project Creation

### Issue: "Failed to create project"

**Possible Causes & Solutions:**

1. **Backend not running**
   - Check: http://localhost:8000/health should return `{"status": "healthy"}`
   - Solution: Start backend server (see step 3 above)

2. **Database connection issues**
   - Check: Verify DATABASE_URL in `/Users/jadenryu/Documents/zyra/backend/.env`
   - Solution: Run `alembic upgrade head` to apply migrations

3. **Authentication issues**
   - Check: Browser dev tools -> Application -> Local Storage -> `auth_token` should exist
   - Solution: Sign out and sign back in

4. **CORS issues**
   - Check: Browser dev tools -> Network tab for CORS errors
   - Solution: Verify frontend is running on http://localhost:3000

## 🎯 Complete User Workflow Test

After fixing the issues above, test this workflow:

1. **Sign In/Register** → Should store `auth_token` in localStorage
2. **Create Project** → Should redirect to project page
3. **Upload Dataset** → Should show in datasets list
4. **View Analytics** → Should display project data
5. **Train Model** → Should initiate training process

## 🐛 Debug Mode

The frontend has been enhanced with detailed logging. Open browser dev tools to see:

- API request details
- Response status and headers  
- Error messages with full context
- Backend connectivity status

## 📞 Need Help?

If issues persist, check the browser console and backend logs for specific error messages.