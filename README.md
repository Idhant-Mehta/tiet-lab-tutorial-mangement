# CodeGrade - Programming Assignment Platform

CodeGrade is a web-based programming assignment platform designed for computer science education. Teachers can create, distribute, and evaluate C programming assignments while students get an integrated coding environment for solving problems.

## Features

- 🤖 AI-powered assignment generation
- 📝 Real-time code submission and evaluation
- 👥 Role-based access (Teachers & Students)
- 🗄️ PostgreSQL database with Drizzle ORM
- 🎨 Modern React frontend with TypeScript
- 🐳 Docker support for easy deployment

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or use Neon Database)
- Docker (optional, for containerized deployment)

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ai\ project/CodeGrade
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file with:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/codegrade
NODE_ENV=development
PORT=5000
SESSION_SECRET=your-secret-key-here

# Optional: AI Integration
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

5. Setup database:
```bash
npm run db:push
```

6. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Deployment Options

### 🐳 Docker Deployment (Recommended)

#### Option 1: Docker Compose (Complete Setup)

1. Configure environment in `docker-compose.yml` or create `.env` file
2. Run the complete stack:

```bash
cd "ai project"
docker-compose up -d
```

This will start:
- CodeGrade application on port 5000
- PostgreSQL database (if configured)

#### Option 2: Docker Only

```bash
cd "ai project/CodeGrade"

# Build the image
docker build -t codegrade .

# Run the container
docker run -d \
  -p 5000:5000 \
  -e DATABASE_URL="your-database-url" \
  -e NODE_ENV="production" \
  -e SESSION_SECRET="your-secret" \
  --name codegrade \
  codegrade
```

### ☁️ Cloud Platform Deployment

#### Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Configure `vercel.json` (already included)
3. Set environment variables in Vercel dashboard
4. Deploy: `vercel --prod`

#### Railway Deployment

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will automatically deploy on git push

#### Heroku Deployment

1. Create Heroku app: `heroku create your-app-name`
2. Set environment variables: `heroku config:set DATABASE_URL=...`
3. Deploy: `git push heroku main`

### 🖥️ VPS/Server Deployment

#### Using PM2 (Process Manager)

1. Install PM2: `npm install -g pm2`
2. Build the application: `npm run build`
3. Start with PM2: `pm2 start dist/index.js --name codegrade`
4. Setup auto-restart: `pm2 startup && pm2 save`

#### Using systemd (Linux)

1. Create service file: `/etc/systemd/system/codegrade.service`
```ini
[Unit]
Description=CodeGrade Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/codegrade
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=NODE_ENV=production
Environment=DATABASE_URL=your-database-url

[Install]
WantedBy=multi-user.target
```

2. Enable and start:
```bash
sudo systemctl enable codegrade
sudo systemctl start codegrade
```

## Database Setup

### Using Neon Database (Recommended for Cloud)

1. Create account at [neon.tech](https://neon.tech)
2. Create a new database
3. Copy the connection string to your `DATABASE_URL`

### Using Local PostgreSQL

1. Install PostgreSQL
2. Create database: `createdb codegrade`
3. Update `DATABASE_URL` in `.env`

### Using Docker PostgreSQL

```bash
docker run -d \
  --name postgres-codegrade \
  -e POSTGRES_DB=codegrade \
  -e POSTGRES_USER=codegrade \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `5000` |
| `SESSION_SECRET` | Session encryption key | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key for AI features | No | - |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI features | No | - |

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema changes

### Project Structure

```
CodeGrade/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── dist/            # Built application
├── Dockerfile       # Docker configuration
└── package.json     # Dependencies and scripts
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change `PORT` environment variable
   - Kill process using port: `lsof -ti:5000 | xargs kill`

2. **Database connection failed**
   - Verify `DATABASE_URL` is correct
   - Ensure database is running and accessible
   - Check firewall rules

3. **Build fails**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

4. **Docker build fails**
   - Ensure Docker daemon is running
   - Check Dockerfile for syntax errors
   - Verify all files are copied correctly

### Logs

- Development: Logs appear in console
- Production: Use PM2 logs `pm2 logs codegrade`
- Docker: `docker logs container-name`

## Production Considerations

### Security

- Use strong `SESSION_SECRET`
- Enable HTTPS in production
- Set up proper firewall rules
- Regular security updates

### Performance

- Use PostgreSQL connection pooling
- Enable gzip compression
- Set up CDN for static assets
- Monitor memory usage

### Monitoring

- Set up health checks
- Monitor database performance
- Log errors and metrics
- Set up alerts for downtime

## Support

For issues and questions:
1. Check this README
2. Look at existing GitHub issues
3. Create a new issue with detailed information

## License

MIT License - see LICENSE file for details
