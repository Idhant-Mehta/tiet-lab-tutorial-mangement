# C Programming Assignment Platform

A web-based platform for C programming evaluation with AI integration, featuring role-based access for teachers and students.

## Features

### Teacher Panel
- 🤖 AI-powered assignment generation (GPT integration)
- 📊 Dashboard with analytics and statistics
- 👥 Student submission monitoring
- 📝 Manual assignment creation
- 🔍 Real-time submission tracking

### Student Panel
- 📚 Browse available assignments
- 💻 Monaco code editor for C programming
- 🐳 Secure Docker-based code execution
- ✅ Real-time test case validation
- 🎯 AI-powered feedback on submissions
- 📈 Submission history and progress tracking

### Technical Features
- 🔐 JWT-based authentication
- 🏗️ RESTful API design
- 🐳 Docker containerization
- 🎨 Modern React frontend with Tailwind CSS
- 🤖 OpenAI GPT integration
- 🔒 Secure code execution sandbox

## Prerequisites

- Docker and Docker Compose installed
- OpenAI API key (optional, for AI features)

## Quick Start

### 1. Clone or Navigate to Project Directory
```bash
cd "C:\Users\Idhant\Desktop\New folder (4)"
```

### 2. Configure Environment Variables
Edit `backend/.env` file:
```env
DATABASE_URL=postgresql://user:password@db:5432/c_programming_platform
SECRET_KEY=your-secret-key-here-change-in-production-12345
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
OPENAI_API_KEY=your-openai-api-key-here
DOCKER_HOST=unix:///var/run/docker.sock
```

**Important:** Replace `your-openai-api-key-here` with your actual OpenAI API key for AI features.

### 3. Build and Run with Docker Compose
```bash
docker-compose up --build
```

This will:
- Build the backend (FastAPI) container
- Build the frontend (React) container  
- Start PostgreSQL database
- Set up networking between services

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## Default Demo Accounts

For testing purposes, you can create accounts through the registration page or use these demo credentials once you've set up the database:

- **Teacher:** 
  - Username: `teacher`
  - Password: `password`
  
- **Student:**
  - Username: `student` 
  - Password: `password`

## Manual Setup (Alternative)

If you prefer to run services individually:

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Database Setup
```bash
# Start PostgreSQL (if not using Docker)
docker run --name postgres-db -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=c_programming_platform -p 5432:5432 -d postgres:15
```

## Project Structure

```
c-programming-platform/
├── backend/
│   ├── app/
│   │   ├── apis/          # API routes (auth, teacher, student)
│   │   ├── core/          # Configuration and security
│   │   ├── db/            # Database models and schemas
│   │   └── services/      # AI service and code execution
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React context (Auth)
│   │   ├── pages/         # Main application pages
│   │   └── services/      # API integration
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## Usage Guide

### For Teachers
1. Register as a teacher on the registration page
2. Login to access the teacher dashboard
3. Click "Generate AI Assignment" to create problems automatically
4. Monitor student submissions and progress
5. View detailed analytics and feedback

### For Students  
1. Register as a student on the registration page
2. Login to access available assignments
3. Select an assignment and choose a problem
4. Write C code in the Monaco editor
5. Submit and receive instant feedback
6. View your submission history and AI-generated feedback

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login-json` - Login user
- `GET /api/auth/me` - Get current user info

### Teacher Endpoints
- `GET /api/teacher/dashboard` - Get dashboard stats
- `POST /api/teacher/assignments/generate` - Generate AI assignment
- `GET /api/teacher/assignments` - List assignments
- `GET /api/teacher/assignments/{id}` - Get specific assignment

### Student Endpoints
- `GET /api/student/dashboard` - Get dashboard stats  
- `GET /api/student/assignments` - List available assignments
- `GET /api/student/problems/{id}` - Get problem details
- `POST /api/student/submissions` - Submit code
- `GET /api/student/submissions` - Get submission history

## Troubleshooting

### Common Issues

1. **Docker Build Fails**
   - Ensure Docker is running
   - Check system resources (RAM, disk space)
   - Try: `docker-compose down && docker-compose up --build`

2. **Database Connection Error**
   - Verify PostgreSQL container is running: `docker ps`
   - Check DATABASE_URL in .env file
   - Wait for database to fully initialize

3. **Frontend Not Loading**
   - Check if backend is running on port 8000
   - Verify REACT_APP_API_URL in frontend environment
   - Clear browser cache

4. **Code Execution Fails**
   - Ensure Docker daemon is accessible to backend container
   - Check if gcc image is available: `docker images | grep gcc`
   - Verify DOCKER_HOST environment variable

5. **AI Features Not Working**
   - Verify OpenAI API key is set correctly in .env
   - Check API key permissions and credits
   - Review backend logs for API errors

### Development Mode

For development with hot reload:

```bash
# Backend with auto-reload
cd backend
uvicorn app.main:app --reload

# Frontend with development server  
cd frontend
npm start
```

## Security Notes

- Change default SECRET_KEY in production
- Use environment-specific configuration
- Implement proper API rate limiting
- Secure Docker daemon access
- Use HTTPS in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes. Please ensure you have proper licensing for OpenAI API usage.
