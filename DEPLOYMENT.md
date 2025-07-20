# Deployment Guide for Zyra

This guide explains how to deploy Zyra to various platforms while properly managing environment variables.

## Environment Variables Setup

### Backend Environment Variables

Copy the structure from `backend/env.example` and set up the following variables:

#### Required Variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `SECRET_KEY`: JWT secret key for authentication
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time

#### Optional Variables:
- `REDIS_URL`: Redis connection string (for caching)
- `SUPABASE_STORAGE_BUCKET`: File storage bucket name
- `MAX_FILE_SIZE`: Maximum file upload size
- `OPENAI_API_KEY` or `OPENROUTER_API_KEY`: AI service API key
- `DEBUG`: Set to False in production
- `ENVIRONMENT`: Set to "production" in production
- `CORS_ORIGINS`: Allowed CORS origins
- `ALLOWED_HOSTS`: Allowed hosts for the application

### Frontend Environment Variables

Copy the structure from `frontend/env.local.example` and set up:

- `NEXT_PUBLIC_API_URL`: Backend API URL

## Platform-Specific Deployment

### Railway Deployment

1. **Backend Deployment:**
   - Connect your GitHub repository to Railway
   - Set the root directory to `backend/`
   - Add all environment variables from `backend/env.example`
   - Set the build command: `pip install -r requirements.txt`
   - Set the start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

2. **Frontend Deployment:**
   - Create a new service in Railway
   - Set the root directory to `frontend/`
   - Add environment variables:
     - `NEXT_PUBLIC_API_URL`: Your backend Railway URL
   - Set the build command: `npm install && npm run build`
   - Set the start command: `npm start`

### Vercel Deployment

1. **Frontend Deployment:**
   - Connect your GitHub repository to Vercel
   - Set the root directory to `frontend/`
   - Add environment variables in Vercel dashboard:
     - `NEXT_PUBLIC_API_URL`: Your backend API URL
   - Vercel will automatically detect Next.js and deploy

2. **Backend Deployment:**
   - Use Railway or another platform for the backend
   - Or use Vercel Serverless Functions (limited for FastAPI)

### Heroku Deployment

1. **Backend Deployment:**
   - Create a new Heroku app
   - Set the buildpack to Python
   - Add environment variables in Heroku dashboard
   - Deploy using: `git subtree push --prefix backend heroku main`

2. **Frontend Deployment:**
   - Use Vercel or Netlify for the frontend
   - Or build and serve static files from Heroku

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong, unique secrets** for `SECRET_KEY`
3. **Rotate API keys** regularly
4. **Use environment-specific configurations**
5. **Enable HTTPS** in production
6. **Set up proper CORS** origins
7. **Use database connection pooling** in production

## Local Development

1. Copy `backend/env.example` to `backend/.env`
2. Copy `frontend/env.local.example` to `frontend/.env.local`
3. Fill in your actual values
4. Start the backend: `cd backend && python -m uvicorn app.main:app --reload`
5. Start the frontend: `cd frontend && npm run dev`

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure `CORS_ORIGINS` includes your frontend URL
2. **Database Connection**: Verify `DATABASE_URL` is correct and accessible
3. **API Key Issues**: Check that your Supabase and AI service keys are valid
4. **Build Failures**: Ensure all dependencies are properly installed

### Environment Variable Debugging:

- Check that all required variables are set
- Verify variable names match exactly (case-sensitive)
- Ensure no extra spaces or quotes in values
- Test locally before deploying

## Support

For deployment issues, check:
1. Platform-specific documentation
2. Environment variable configuration
3. Network connectivity between services
4. Database and external service availability 