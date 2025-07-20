# Zyra - AI-Powered Data Analysis Platform

Zyra is a sleek, AI-powered web app designed to automate and streamline the early, tedious steps of data analysis so analysts and junior data scientists can move fast and focus on insights, not grunt work.

## Features

- **Data Ingestion**: Support for CSV, Excel, JSON, and database connections
- **Automated Data Cleaning**: Fix data types, handle missing values, detect outliers
- **Exploratory Data Analysis**: Rich visualizations and statistical summaries
- **Smart Feature Engineering**: Automated encoding, scaling, and interaction terms
- **Model Training**: Baseline ML models with explainability tools
- **Statistical Testing**: Built-in t-tests, chi-square, ANOVA, and A/B testing
- **Export & Deploy**: Python scripts, Jupyter notebooks, and one-click APIs
- **Collaboration**: Real-time editing, versioning, and team dashboards

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: FastAPI, Python, Celery, Redis
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Deployment**: Vercel (Frontend), Railway (Backend)
- **Authentication**: Supabase Auth

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL database
- Redis server
- Supabase account

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```

6. **Start the backend server:**
   ```bash
   python run.py
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.local.example .env.local
   # Edit .env.local with your API URL
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Environment Variables

### Backend (.env)

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/zyra_db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Authentication
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Storage
SUPABASE_STORAGE_BUCKET=zyra-files
MAX_FILE_SIZE=100MB

# External APIs
OPENAI_API_KEY=your-openai-api-key

# Development
DEBUG=True
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Production
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Documentation

Once the backend is running, you can access the interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
zyra/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Configuration and utilities
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── alembic/            # Database migrations
│   ├── tests/              # Backend tests
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities and API client
│   ├── public/            # Static assets
│   └── package.json       # Node.js dependencies
└── README.md              # This file
```

## Development

### Backend Development

- **Run tests:** `pytest`
- **Format code:** `black .`
- **Lint code:** `flake8`
- **Type checking:** `mypy .`

### Frontend Development

- **Run tests:** `npm test`
- **Lint code:** `npm run lint`
- **Build for production:** `npm run build`

## Deployment

### Backend (Railway)

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests and linting
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@zyra.ai or join our Slack community.