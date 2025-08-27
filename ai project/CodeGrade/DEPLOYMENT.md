# Quick Deployment Guide

## 🚀 One-Click Deployments

### Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/your-template)

1. Click "Deploy Now"
2. Connect your GitHub repository
3. Set environment variables:
   - `DATABASE_URL` (Railway will provide PostgreSQL)
   - `SESSION_SECRET`
   - `OPENAI_API_KEY` (optional)

### Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/your-repo)

1. Click "Deploy"
2. Connect external PostgreSQL database (Neon, Supabase, etc.)
3. Set environment variables in Vercel dashboard

### Heroku
```bash
# Install Heroku CLI first
heroku create your-app-name
heroku addons:create heroku-postgresql:mini
heroku config:set SESSION_SECRET=your-secret-key
git push heroku main
```

## 🐳 Docker Deployment

### Quick Start
```bash
# Clone and navigate to project
git clone <your-repo>
cd "ai project"

# Start with Docker Compose
docker-compose up -d
```

### Custom Docker Setup
```bash
cd "ai project/CodeGrade"

# Build image
docker build -t codegrade .

# Run with external database
docker run -d \
  -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e SESSION_SECRET="your-secret" \
  codegrade
```

## 🖥️ VPS Deployment

### Using the Deploy Script
```bash
cd "ai project/CodeGrade"
./deploy.sh prod
```

### Manual Steps
```bash
# Install dependencies
npm ci

# Set up environment
cp .env.example .env
# Edit .env with your values

# Build and start
npm run build
npm start
```

## 📋 Environment Variables Checklist

Required:
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `SESSION_SECRET` - Random string for session encryption

Optional:
- [ ] `PORT` - Server port (default: 5000)
- [ ] `NODE_ENV` - Environment mode (default: development)
- [ ] `OPENAI_API_KEY` - For AI assignment generation
- [ ] `ANTHROPIC_API_KEY` - Alternative AI provider

## 🔧 Database Setup

### Neon (Recommended)
1. Visit [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string to `DATABASE_URL`

### Supabase
1. Visit [supabase.com](https://supabase.com)
2. Create new project
3. Get PostgreSQL connection string
4. Set as `DATABASE_URL`

### Local PostgreSQL
```bash
# Install PostgreSQL, then:
createdb codegrade
export DATABASE_URL="postgresql://localhost:5432/codegrade"
```

## 🚑 Troubleshooting

### Common Issues:
1. **Build fails**: Check Node.js version (needs 18+)
2. **Database error**: Verify `DATABASE_URL` format
3. **Port in use**: Change `PORT` environment variable
4. **Docker fails**: Ensure Docker daemon is running

### Health Check:
Visit `/api/health` to verify the server is running properly.

## 📊 Monitoring

### Application Health
- Health endpoint: `GET /api/health`
- Returns: `{"status": "ok", "timestamp": "...", "version": "1.0.0"}`

### Logs
- Development: Console output
- Production: Use PM2 (`pm2 logs`) or Docker logs
- Cloud: Check platform-specific logging