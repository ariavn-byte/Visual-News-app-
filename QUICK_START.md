# Quick Start Guide - News API Integration

This guide helps you quickly set up and start using the News API integration features.

## Prerequisites

- Node.js 14+ installed
- API keys for news services (optional but recommended)

## Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

Add your API keys to `.env`:
```bash
NEWS_API_KEY=your_newsapi_key_here
MEDIASTACK_API_KEY=your_mediastack_key_here
```

### 3. Test the Integration
```bash
# Run the test script to verify everything works
npm test
```

### 4. Start the Server
```bash
npm start
```

The server will start on http://localhost:3000

## API Endpoints

### Health Check
```bash
curl http://localhost:3000/api/health
```

### News API Health Check
```bash
curl http://localhost:3000/api/health/news
```

### Search News
```bash
# Search for articles
curl "http://localhost:3000/api/news/search?q=syria&language=en"

# Search with time filter
curl "http://localhost:3000/api/news/search?q=middle%20east&timespan=1d"
```

### Get News by Country
```bash
# Get news for a specific country (2-letter country code)
curl http://localhost:3000/api/news/country/us

# With time filter
curl "http://localhost:3000/api/news/country/us?timespan=3d"
```

### Cache Management
```bash
# Get cache statistics
curl http://localhost:3000/api/cache/stats

# Clear cache
curl -X POST http://localhost:3000/api/cache/clear
```

## Getting API Keys

### NewsAPI.org (Recommended)
1. Visit https://newsapi.org/
2. Sign up for a free account
3. Get your API key from the dashboard
4. Free tier: 1000 requests/day

### MediaStack (Optional)
1. Visit https://mediastack.com/
2. Sign up for a free account  
3. Get your API key
4. Free tier: 1000 requests/month

### GDELT (No API Key Required)
- Automatically available
- No rate limits for reasonable usage
- Best for historical and geopolitical event data

## Example Frontend Integration

```javascript
// Example: Fetch news for display on the map
async function fetchNewsForLocation(location) {
  try {
    const response = await fetch(`/api/news/search?q=${encodeURIComponent(location)}`);
    const data = await response.json();
    
    // Process articles for display
    data.articles.forEach(article => {
      console.log(`${article.title} - ${article.source.name}`);
    });
    
    return data.articles;
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return [];
  }
}

// Example: Get country-specific news
async function fetchCountryNews(countryCode) {
  try {
    const response = await fetch(`/api/news/country/${countryCode}`);
    const data = await response.json();
    return data.articles;
  } catch (error) {
    console.error('Failed to fetch country news:', error);
    return [];
  }
}
```

## Troubleshooting

### Common Issues

1. **"ENOTFOUND" errors**: Network connectivity issues or API endpoints blocked
2. **401/403 errors**: Invalid API keys or rate limits exceeded
3. **Empty results**: API quotas exceeded or no matches found

### Debug Mode
Set `NODE_ENV=development` in your `.env` file for detailed error messages.

### Rate Limiting
- The system includes built-in rate limiting
- Responses are cached to reduce API calls
- Monitor your API usage through the health endpoints

## Next Steps

1. **Frontend Integration**: Use the `/api/news/search` endpoint to replace static data
2. **Real-time Updates**: Set up periodic data refresh
3. **Enhanced Filtering**: Add location-based and topic-based filtering
4. **Caching Strategy**: Implement Redis for production caching

For detailed implementation patterns, see [NEWS_API_INTEGRATION.md](../NEWS_API_INTEGRATION.md)