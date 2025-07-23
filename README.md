# Zyra - AI-Powered Data Analysis Platform

Zyra is a sleek, AI-powered web app designed to automate and streamline the early, tedious steps of data analysis so analysts and junior data scientists can move fast and focus on insights, not grunt work.

![Zyra Architecture](./docs/zyra-architecture.png)

## Features

- **Data Ingestion**: Support for CSV, Excel, JSON, and database connections
- **Automated Data Cleaning**: Fix data types, handle missing values, detect outliers
- **Exploratory Data Analysis**: Rich visualizations and statistical summaries
- **Smart Feature Engineering**: Automated encoding, scaling, and interaction terms
- **Model Training**: Baseline ML models with explainability tools
- **Statistical Testing**: Built-in t-tests, chi-square, ANOVA, and A/B testing
- **Export & Deploy**: Python scripts, Jupyter notebooks, and one-click APIs
- **Collaboration**: Real-time editing, versioning, and team dashboards
- **AI Assistant**: Chat-style agent for data insights and recommendations

## Implemented Features

- ✅ User authentication (login/register)
- ✅ Dataset upload with drag-and-drop
- ✅ Dataset listing and management
- ✅ Dataset analysis with visualizations
- ✅ ML model training and management
- ✅ AI chat assistant for data insights
- ✅ Modern UI with shadcn/ui components

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
   # Edit .env.local with your configuration
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
zyra/
  ├── backend/               # FastAPI backend
  │   ├── alembic/           # Database migrations
  │   ├── app/               # Application code
  │   │   ├── api/           # API endpoints
  │   │   ├── core/          # Core functionality
  │   │   ├── models/        # Database models
  │   │   ├── schemas/       # Pydantic schemas
  │   │   ├── services/      # Business logic
  │   │   └── utils/         # Utility functions
  │   └── tests/             # Backend tests
  │
  ├── frontend/              # Next.js frontend
  │   ├── public/            # Static assets
  │   └── src/               # Source code
  │       ├── app/           # Next.js app router
  │       ├── components/    # React components
  │       └── lib/           # Utility functions
  │
  └── docs/                  # Documentation
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.