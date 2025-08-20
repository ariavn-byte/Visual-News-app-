# Node.js Development Setup

## Quick Start

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start development server (frontend + backend):**
   ```bash
   npm run dev
   ```

3. **Start backend only:**
   ```bash
   npm run backend
   ```

4. **Serve frontend only:**
   ```bash
   npm run serve-frontend
   ```

## Environment Setup

1. **Backend Environment:**
   - Copy `backend/.env.example` to `backend/.env`
   - Update environment variables as needed

2. **Ports:**
   - Backend API: http://localhost:3000
   - Frontend: http://localhost:8080 (when using dev server)

## API Endpoints

- **Health Check:** `GET /api/health`

## Development

- Backend code is in `backend/` directory
- Frontend code is in the root directory (`index.html`, `app.js`, `style.css`, `data.js`)
- Use `npm run dev` to run both frontend and backend simultaneously

## Dependencies

### Backend
- Express.js for API server
- CORS for cross-origin requests
- dotenv for environment configuration
- axios for HTTP requests

### Development
- concurrently for running multiple scripts
- http-server for serving frontend files