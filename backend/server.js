// Load environment variables from .env file
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');
const { NewsAggregator } = require('./news-aggregator');
const { NewsAPIClient, GDELTClient, MediaStackClient } = require('./news-clients');

// Create Express app
const app = express();

// Middlewares
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable parsing of JSON request bodies

// Define a port, with a fallback for production environments
const PORT = process.env.PORT || 3000;

// Initialize news aggregator with available API keys
const newsAggregator = new NewsAggregator({
  newsApiKey: process.env.NEWS_API_KEY,
  mediaStackKey: process.env.MEDIASTACK_API_KEY,
  maxArticlesPerSource: 50
});

// --- API Routes ---

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Server is running' });
});

// News API health check
app.get('/api/health/news', async (req, res) => {
  try {
    const healthChecks = [];
    
    // Test each configured API
    if (process.env.NEWS_API_KEY) {
      try {
        const newsClient = new NewsAPIClient(process.env.NEWS_API_KEY);
        await newsClient.getTopHeadlines({ pageSize: 1 });
        healthChecks.push({ service: 'NewsAPI', status: 'healthy' });
      } catch (error) {
        healthChecks.push({ service: 'NewsAPI', status: 'unhealthy', error: error.message });
      }
    }

    if (process.env.MEDIASTACK_API_KEY) {
      try {
        const mediaClient = new MediaStackClient(process.env.MEDIASTACK_API_KEY);
        await mediaClient.getNews({ limit: 1 });
        healthChecks.push({ service: 'MediaStack', status: 'healthy' });
      } catch (error) {
        healthChecks.push({ service: 'MediaStack', status: 'unhealthy', error: error.message });
      }
    }

    // GDELT doesn't require API key
    try {
      const gdeltClient = new GDELTClient();
      await gdeltClient.searchEvents('test', { maxrecords: 1 });
      healthChecks.push({ service: 'GDELT', status: 'healthy' });
    } catch (error) {
      healthChecks.push({ service: 'GDELT', status: 'unhealthy', error: error.message });
    }

    const allHealthy = healthChecks.every(check => check.status === 'healthy');
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      services: healthChecks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get aggregated news by search query
app.get('/api/news/search', async (req, res) => {
  try {
    const { q, language, timespan } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Query parameter "q" is required'
      });
    }

    if (q.length > 500) {
      return res.status(400).json({
        error: 'Query too long (max 500 characters)'
      });
    }

    const results = await newsAggregator.aggregateNews(q, {
      language: language || 'en',
      timespan: timespan || '3d'
    });

    res.json(results);
  } catch (error) {
    console.error('News search error:', error);
    res.status(500).json({
      error: 'Failed to fetch news',
      message: error.message
    });
  }
});

// Get news by country
app.get('/api/news/country/:country', async (req, res) => {
  try {
    const { country } = req.params;
    const { timespan } = req.query;
    
    if (!country || country.length !== 2) {
      return res.status(400).json({
        error: 'Country parameter must be a valid 2-letter country code'
      });
    }

    const results = await newsAggregator.getNewsByCountry(country, {
      timespan: timespan || '1d'
    });

    res.json(results);
  } catch (error) {
    console.error('Country news error:', error);
    res.status(500).json({
      error: 'Failed to fetch country news',
      message: error.message
    });
  }
});

// Get available news sources
app.get('/api/news/sources', async (req, res) => {
  try {
    const sources = await newsAggregator.getAvailableSources();
    res.json(sources);
  } catch (error) {
    console.error('Sources error:', error);
    res.status(500).json({
      error: 'Failed to fetch sources',
      message: error.message
    });
  }
});

// Cache management endpoints
app.get('/api/cache/stats', (req, res) => {
  try {
    const stats = newsAggregator.getCacheStats();
    res.json({ 
      size: stats.size(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get cache stats',
      message: error.message
    });
  }
});

app.post('/api/cache/clear', (req, res) => {
  try {
    const result = newsAggregator.getCacheStats().clear();
    res.json({ message: result });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// --- Start the server ---
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
  console.log(`Available APIs: ${Object.keys(newsAggregator.clients).join(', ')}`);
});
