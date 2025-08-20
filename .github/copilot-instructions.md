# Visual News Source - Interactive Geopolitical Mapping Tool

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Project Overview
Visual News Source is an interactive mapping tool for geopolitical analysis built with Leaflet.js and JavaScript. It visualizes news events in the Middle East with AI-powered analysis capabilities (Gemini API integration). The frontend is pure HTML/CSS/JS with no build system, and includes a simple Node.js Express backend.

## Working Effectively

### Frontend Development
- **Bootstrap the frontend:**
  - Frontend consists of static files: `index.html`, `app.js`, `data.js`, `style.css`
  - Serve with any HTTP server: `cd /path/to/repo && python3 -m http.server 8000`
  - Access at `http://localhost:8000`
  - **INTERNET DEPENDENCY**: Frontend requires external CDN access for Leaflet maps and plugins. In restricted environments, map functionality will be limited.

### Backend Development
- **Bootstrap and run the backend:**
  - `cd backend`
  - `npm install` -- takes ~1 second. NEVER CANCEL.
  - `npm start` -- starts immediately, runs on port 3000
  - Test health endpoint: `curl http://localhost:3000/api/health`
  - **Expected response**: `{"status":"UP","message":"Server is running"}`

### Environment Setup
- **Backend configuration:**
  - Copy `backend/.env.example` to `backend/.env`
  - Set `PORT=3000` and any required API keys
  - Backend works without API keys for basic functionality

## Build and Test Process

### Current Build Status
- **No build process required**: Frontend is static files, backend uses standard Node.js
- **No existing tests**: Project currently has no test infrastructure
- **CI/CD expectation mismatch**: GitHub workflows expect root `package.json` but only `backend/package.json` exists

### Creating Tests (if needed)
- No existing test framework - would need to be added
- For backend: Consider using Jest or Mocha
- For frontend: Consider using Playwright or Cypress for integration tests
- Backend API can be tested with simple curl commands or supertest

### Validation Commands
- **Backend validation:**
  - `cd backend && npm install && npm start`
  - `curl http://localhost:3000/api/health` should return status "UP"
- **Frontend validation:**
  - `python3 -m http.server 8000` in repo root
  - Access `http://localhost:8000` - page should load (map requires internet)

## Development Workflow

### Making Changes
- **Frontend changes**: Edit HTML/CSS/JS files directly, refresh browser
- **Backend changes**: Restart server with `npm start` after changes (~1 second restart time)
- **Data changes**: Edit `data.js` file directly, contains event data and geographic boundaries
- **Environment changes**: Copy `backend/.env.example` to `backend/.env` and modify as needed

### Key Files and Locations
- `index.html` - Main application page with map container (50 lines)
- `app.js` - Core application logic, map initialization, event handling (152 lines)
- `data.js` - Static event data and country boundaries (54 lines, client-side storage)
- `style.css` - Custom styling for UI panels and map elements (68 lines)
- `backend/server.js` - Express server with health endpoint (28 lines)
- `README.md` - Project overview and features
- `Roadmap.md` - Detailed development roadmap and technical debt

### Development Workflow Validation
To test your development setup works correctly:
1. `cd backend && npm install && npm start` (should start in ~1 second)
2. `curl http://localhost:3000/api/health` (should return `{"status":"UP","message":"Server is running"}`)
3. In new terminal: `python3 -m http.server 8000` in repo root
4. `curl -I http://localhost:8000/` (should return `200 OK`)
5. Open browser to `http://localhost:8000` - page loads (map needs internet)

### Code Architecture
- **Global scope warning**: Much code in `app.js` runs in global scope (noted in roadmap as technical debt)
- **Inline JavaScript**: HTML contains inline event handlers (e.g., `onclick="..."`)
- **Static data**: All event data stored in client-side `data.js` file
- **CDN dependencies**: External libraries loaded from CDNs (Leaflet, plugins)

## Common Development Scenarios

### Adding New Events
- Edit `data.js` to add events to the `eventData` object
- Format: `{ "name": "City", "lat": 0.0, "lng": 0.0, "event": "Description", "newsVolume": 1-10 }`
- Optionally add connections: `"connections": [{ "target": "OtherCity", "strength": 1-3, "chainId": "identifier" }]`

### Styling Changes
- Edit `style.css` for UI elements
- Map styling controlled through Leaflet options in `app.js`

### Backend API Extensions
- Add routes to `backend/server.js`
- Follow existing pattern: `app.get('/api/endpoint', (req, res) => { ... })`

## Limitations and Known Issues

### External Dependencies
- **CDN blocking**: In restricted environments, Leaflet maps and plugins fail to load with ERR_BLOCKED_BY_CLIENT
- **Internet requirement**: Full functionality requires internet access for external resources
- **No local fallbacks**: No offline versions of map tiles or plugin libraries
- **Specific blocked resources**: Leaflet core, marker clustering, minimap, measure, search, and heat plugins
- **Testing limitation**: In sandboxed environments, only the UI shell loads, no interactive map functionality

### Architecture Limitations (from Roadmap.md)
- Client-side data storage doesn't scale beyond current dataset
- API keys exposed on client side (security concern)
- Monolithic `app.js` file needs modularization
- Global scope pollution needs refactoring

### CI/CD Issues
- GitHub workflows expect root `package.json` but none exists
- Workflows run `npm ci`, `npm run build --if-present`, `npm test` in root (will fail)
- Only backend has proper Node.js package structure

## Manual Testing Scenarios

### Complete Frontend Test
1. Start frontend server: `python3 -m http.server 8000`
2. Open `http://localhost:8000` in browser
3. **With internet**: Verify map loads, zoom/pan works, event hotspots appear
4. **Without internet**: Page loads but map will be blank (expected limitation)
5. Click on event hotspots to test popup functionality
6. Test analysis panel opening/closing

### Complete Backend Test
1. Start backend: `cd backend && npm install && npm start`
2. Test health endpoint: `curl http://localhost:3000/api/health`
3. Verify CORS enabled for cross-origin requests
4. Check server logs for any errors

### Integration Test
1. Start both frontend and backend servers
2. Frontend on `http://localhost:8000`, backend on `http://localhost:3000`
3. Test any API calls from frontend to backend (if implemented)

## Performance Expectations
- **Backend npm install**: ~0.5 seconds (very fast, minimal dependencies)
- **Backend server start**: Immediate (< 1 second)
- **Frontend server start**: Immediate
- **Page load**: Instant for HTML/CSS/JS (~2.7KB total), map tiles depend on internet speed
- **No build/compile time**: Static files serve immediately
- **Backend restart after changes**: ~1 second total (stop + start)

## Repository Navigation Quick Reference

### Current Directory Structure
```
.
├── README.md              # Project overview
├── Roadmap.md            # Development roadmap and technical debt
├── Sources.md            # Data sources documentation
├── index.html            # Main application HTML
├── app.js               # Core JavaScript logic
├── data.js              # Static event and geographic data
├── style.css            # Custom styles
├── backend/             # Node.js Express server
│   ├── package.json     # Backend dependencies
│   ├── server.js        # Express server
│   └── .env.example     # Environment configuration template
└── .github/
    └── workflows/       # CI/CD workflows (currently non-functional)
```

### Frequently Accessed Files for Development
- `app.js` - Main application logic, start here for frontend changes
- `data.js` - Event data, modify for content updates
- `backend/server.js` - Backend logic, start here for API changes
- `style.css` - UI styling
- `Roadmap.md` - Technical debt and future plans

## Important Reminders
- **Always test with real internet connection** for full functionality validation
- **Frontend requires CDN access** - document any changes that affect external dependencies
- **No existing test framework** - manual testing required for all changes
- **Monolithic architecture** - changes to `app.js` may have wide-reaching effects
- **Static data approach** - large dataset changes may require architectural changes noted in roadmap