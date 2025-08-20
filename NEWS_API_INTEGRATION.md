# News API Integration Best Practices

## Overview

This document provides comprehensive best practices for integrating news APIs into the Visual News Source project. It covers security, performance, reliability, and implementation patterns for various news data sources.

## Table of Contents

1. [Security Best Practices](#security-best-practices)
2. [API Key Management](#api-key-management)
3. [Rate Limiting & Throttling](#rate-limiting--throttling)
4. [Error Handling & Retry Logic](#error-handling--retry-logic)
5. [Data Validation & Sanitization](#data-validation--sanitization)
6. [Caching Strategies](#caching-strategies)
7. [News API Integration Patterns](#news-api-integration-patterns)
8. [Performance Optimization](#performance-optimization)
9. [Monitoring & Logging](#monitoring--logging)
10. [Testing Strategies](#testing-strategies)

## Security Best Practices

### API Key Protection

**❌ Never expose API keys in client-side code**
```javascript
// BAD: API key exposed in frontend
const apiKey = 'your-api-key-here';
fetch(`https://newsapi.org/v2/top-headlines?apiKey=${apiKey}`);
```

**✅ Use backend proxy for API calls**
```javascript
// GOOD: API calls through backend proxy
fetch('/api/news/headlines')
  .then(response => response.json())
  .then(data => processNewsData(data));
```

### Environment Configuration

Always use environment variables for sensitive configuration:

```bash
# .env
NEWS_API_KEY=your_newsapi_key_here
GDELT_API_ENDPOINT=https://api.gdeltproject.org/api/v2/
MEDIASTACK_API_KEY=your_mediastack_key_here
AYLIEN_APP_ID=your_aylien_app_id
AYLIEN_API_KEY=your_aylien_api_key
```

## API Key Management

### 1. Separate Keys by Environment
```bash
# Development
NEWS_API_KEY_DEV=dev_key_here

# Production  
NEWS_API_KEY_PROD=prod_key_here

# Testing
NEWS_API_KEY_TEST=test_key_here
```

### 2. Key Rotation Strategy
- Implement regular API key rotation
- Have backup keys ready for seamless transition
- Log key usage for audit purposes

### 3. Access Control
```javascript
// Example: Role-based API access
const getApiKey = (service, environment, userRole) => {
  if (userRole === 'admin') {
    return process.env[`${service}_API_KEY_${environment.toUpperCase()}`];
  }
  // Return limited access key for regular users
  return process.env[`${service}_API_KEY_LIMITED`];
};
```

## Rate Limiting & Throttling

### 1. Implement Request Queuing
```javascript
class APIRateLimiter {
  constructor(requestsPerMinute = 60) {
    this.requestsPerMinute = requestsPerMinute;
    this.requests = [];
    this.queue = [];
  }

  async makeRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  processQueue() {
    if (this.queue.length === 0) return;

    const now = Date.now();
    // Remove requests older than 1 minute
    this.requests = this.requests.filter(time => now - time < 60000);

    if (this.requests.length < this.requestsPerMinute) {
      const { requestFn, resolve, reject } = this.queue.shift();
      this.requests.push(now);
      
      requestFn()
        .then(resolve)
        .catch(reject)
        .finally(() => this.processQueue());
    } else {
      // Wait before processing next request
      setTimeout(() => this.processQueue(), 1000);
    }
  }
}
```

### 2. API-Specific Rate Limits

| API Service | Free Tier Limit | Recommended Strategy |
|-------------|------------------|---------------------|
| NewsAPI.org | 1000 requests/day | Cache responses, batch requests |
| GDELT | No strict limit | Implement backoff for large queries |
| MediaStack | 1000 requests/month | Use for targeted queries only |
| Aylien | 1000 requests/day | Prioritize high-value content |

## Error Handling & Retry Logic

### 1. Robust Error Handling
```javascript
class NewsAPIClient {
  async fetchWithRetry(url, options, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.warn(`Attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 2. Circuit Breaker Pattern
```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}
```

## Data Validation & Sanitization

### 1. Input Validation
```javascript
const validateNewsQuery = (query) => {
  const errors = [];
  
  if (!query.q || query.q.trim().length === 0) {
    errors.push('Query parameter is required');
  }
  
  if (query.q && query.q.length > 500) {
    errors.push('Query too long (max 500 characters)');
  }
  
  if (query.language && !/^[a-z]{2}$/.test(query.language)) {
    errors.push('Invalid language code');
  }
  
  if (query.pageSize && (query.pageSize < 1 || query.pageSize > 100)) {
    errors.push('Page size must be between 1 and 100');
  }
  
  return errors;
};
```

### 2. Output Sanitization
```javascript
const sanitizeNewsArticle = (article) => {
  return {
    title: sanitizeHtml(article.title || ''),
    description: sanitizeHtml(article.description || ''),
    url: isValidUrl(article.url) ? article.url : null,
    publishedAt: new Date(article.publishedAt).toISOString(),
    source: {
      name: sanitizeHtml(article.source?.name || 'Unknown')
    }
  };
};

const sanitizeHtml = (str) => {
  return str.replace(/<[^>]*>/g, '').trim();
};

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};
```

## Caching Strategies

### 1. Multi-Layer Caching
```javascript
class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.memoryTTL = 5 * 60 * 1000; // 5 minutes
    this.diskTTL = 60 * 60 * 1000; // 1 hour
  }

  async get(key) {
    // Check memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && memoryItem.expiry > Date.now()) {
      return memoryItem.data;
    }

    // Check disk cache (Redis/file system)
    const diskItem = await this.getDiskCache(key);
    if (diskItem) {
      // Promote to memory cache
      this.setMemoryCache(key, diskItem);
      return diskItem;
    }

    return null;
  }

  set(key, data) {
    this.setMemoryCache(key, data);
    this.setDiskCache(key, data);
  }

  setMemoryCache(key, data) {
    this.memoryCache.set(key, {
      data,
      expiry: Date.now() + this.memoryTTL
    });
  }

  async setDiskCache(key, data) {
    // Implementation depends on your storage choice
    // Redis, file system, or database
  }
}
```

### 2. Cache Key Strategy
```javascript
const generateCacheKey = (service, endpoint, params) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
    
  return `${service}:${endpoint}:${JSON.stringify(sortedParams)}`;
};
```

## News API Integration Patterns

### 1. NewsAPI.org Integration
```javascript
class NewsAPIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://newsapi.org/v2';
    this.rateLimiter = new APIRateLimiter(100); // 100 requests per day
  }

  async getTopHeadlines(params = {}) {
    const url = `${this.baseUrl}/top-headlines`;
    const queryParams = new URLSearchParams({
      apiKey: this.apiKey,
      pageSize: 20,
      ...params
    });

    return this.rateLimiter.makeRequest(() =>
      fetch(`${url}?${queryParams}`)
        .then(response => response.json())
    );
  }

  async searchArticles(query, params = {}) {
    const url = `${this.baseUrl}/everything`;
    const queryParams = new URLSearchParams({
      apiKey: this.apiKey,
      q: query,
      sortBy: 'publishedAt',
      pageSize: 20,
      ...params
    });

    return this.rateLimiter.makeRequest(() =>
      fetch(`${url}?${queryParams}`)
        .then(response => response.json())
    );
  }
}
```

### 2. GDELT Project Integration
```javascript
class GDELTClient {
  constructor() {
    this.baseUrl = 'https://api.gdeltproject.org/api/v2';
  }

  async searchEvents(query, params = {}) {
    const url = `${this.baseUrl}/doc/doc`;
    const queryParams = new URLSearchParams({
      query: query,
      mode: 'artlist',
      format: 'json',
      maxrecords: 250,
      sort: 'DateDesc',
      ...params
    });

    return fetch(`${url}?${queryParams}`)
      .then(response => response.json());
  }

  async getGeoEvents(country, timeframe = '1d') {
    const query = `country:${country}`;
    return this.searchEvents(query, { timespan: timeframe });
  }
}
```

### 3. MediaStack Integration
```javascript
class MediaStackClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'http://api.mediastack.com/v1';
  }

  async getNews(params = {}) {
    const url = `${this.baseUrl}/news`;
    const queryParams = new URLSearchParams({
      access_key: this.apiKey,
      limit: 25,
      ...params
    });

    return fetch(`${url}?${queryParams}`)
      .then(response => response.json());
  }

  async getNewsByCountry(countries, keywords = '') {
    return this.getNews({
      countries: Array.isArray(countries) ? countries.join(',') : countries,
      keywords: keywords,
      sort: 'published_desc'
    });
  }
}
```

### 4. Unified News Aggregator
```javascript
class NewsAggregator {
  constructor(clients) {
    this.clients = clients;
    this.cache = new CacheManager();
  }

  async aggregateNews(query, options = {}) {
    const cacheKey = generateCacheKey('aggregated', 'news', { query, ...options });
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const promises = [];

    if (this.clients.newsapi) {
      promises.push(
        this.clients.newsapi.searchArticles(query)
          .then(data => ({ source: 'newsapi', data }))
          .catch(error => ({ source: 'newsapi', error }))
      );
    }

    if (this.clients.gdelt) {
      promises.push(
        this.clients.gdelt.searchEvents(query)
          .then(data => ({ source: 'gdelt', data }))
          .catch(error => ({ source: 'gdelt', error }))
      );
    }

    const results = await Promise.allSettled(promises);
    const aggregated = this.mergeResults(results);
    
    await this.cache.set(cacheKey, aggregated);
    return aggregated;
  }

  mergeResults(results) {
    const merged = {
      articles: [],
      sources: [],
      errors: []
    };

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const { source, data, error } = result.value;
        
        if (error) {
          merged.errors.push({ source, error: error.message });
        } else {
          merged.sources.push(source);
          
          if (data.articles) {
            merged.articles.push(...data.articles.map(article => ({
              ...article,
              source_api: source
            })));
          }
        }
      }
    });

    // Sort by publication date
    merged.articles.sort((a, b) => 
      new Date(b.publishedAt || b.published_at) - 
      new Date(a.publishedAt || a.published_at)
    );

    return merged;
  }
}
```

## Performance Optimization

### 1. Request Optimization
```javascript
// Batch multiple location queries
const batchLocationQueries = async (locations) => {
  const batchSize = 5;
  const results = [];
  
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize);
    const batchPromises = batch.map(location => 
      newsClient.getNewsByLocation(location)
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
    
    // Respect rate limits
    if (i + batchSize < locations.length) {
      await delay(1000);
    }
  }
  
  return results;
};
```

### 2. Response Streaming
```javascript
// Stream large responses
app.get('/api/news/stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Transfer-Encoding': 'chunked'
  });

  res.write('{"articles":[');
  
  let first = true;
  const stream = newsClient.getNewsStream(req.query);
  
  stream.on('data', (article) => {
    if (!first) res.write(',');
    res.write(JSON.stringify(article));
    first = false;
  });
  
  stream.on('end', () => {
    res.write(']}');
    res.end();
  });
});
```

## Monitoring & Logging

### 1. API Usage Monitoring
```javascript
class APIMonitor {
  constructor() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      responseTime: [],
      apiUsage: {}
    };
  }

  logRequest(api, endpoint, startTime) {
    const responseTime = Date.now() - startTime;
    
    this.metrics.requestCount++;
    this.metrics.responseTime.push(responseTime);
    
    if (!this.metrics.apiUsage[api]) {
      this.metrics.apiUsage[api] = { requests: 0, errors: 0 };
    }
    this.metrics.apiUsage[api].requests++;
    
    console.log(`API Request: ${api}/${endpoint} - ${responseTime}ms`);
  }

  logError(api, error) {
    this.metrics.errorCount++;
    this.metrics.apiUsage[api].errors++;
    
    console.error(`API Error: ${api}`, error);
  }

  getStats() {
    const avgResponseTime = this.metrics.responseTime.length > 0 
      ? this.metrics.responseTime.reduce((a, b) => a + b) / this.metrics.responseTime.length
      : 0;

    return {
      totalRequests: this.metrics.requestCount,
      totalErrors: this.metrics.errorCount,
      averageResponseTime: avgResponseTime,
      apiBreakdown: this.metrics.apiUsage
    };
  }
}
```

### 2. Health Checks
```javascript
app.get('/api/health/news-apis', async (req, res) => {
  const healthChecks = await Promise.allSettled([
    checkNewsAPI(),
    checkGDELT(),
    checkMediaStack()
  ]);

  const results = healthChecks.map((check, index) => ({
    service: ['NewsAPI', 'GDELT', 'MediaStack'][index],
    status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
    error: check.status === 'rejected' ? check.reason.message : null
  }));

  const allHealthy = results.every(r => r.status === 'healthy');
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services: results,
    timestamp: new Date().toISOString()
  });
});
```

## Testing Strategies

### 1. Unit Testing API Clients
```javascript
// Test file: newsapi.test.js
const { NewsAPIClient } = require('../src/clients/newsapi');

describe('NewsAPIClient', () => {
  let client;
  
  beforeEach(() => {
    client = new NewsAPIClient(process.env.TEST_NEWS_API_KEY);
  });

  test('should fetch top headlines', async () => {
    const response = await client.getTopHeadlines({ country: 'us' });
    
    expect(response).toHaveProperty('articles');
    expect(Array.isArray(response.articles)).toBe(true);
    expect(response.articles.length).toBeGreaterThan(0);
  });

  test('should handle rate limiting', async () => {
    // Mock rate limiter
    client.rateLimiter = {
      makeRequest: jest.fn().mockResolvedValue({ articles: [] })
    };
    
    await client.getTopHeadlines();
    expect(client.rateLimiter.makeRequest).toHaveBeenCalled();
  });
});
```

### 2. Integration Testing
```javascript
describe('News API Integration', () => {
  test('should aggregate news from multiple sources', async () => {
    const aggregator = new NewsAggregator({
      newsapi: new NewsAPIClient(process.env.TEST_NEWS_API_KEY),
      gdelt: new GDELTClient()
    });

    const results = await aggregator.aggregateNews('ukraine');
    
    expect(results.articles).toBeDefined();
    expect(results.sources.length).toBeGreaterThan(0);
    expect(results.errors.length).toBe(0);
  });
});
```

### 3. Mock Testing for Development
```javascript
class MockNewsClient {
  async getTopHeadlines() {
    return {
      articles: [
        {
          title: 'Mock News Article',
          description: 'This is a mock article for testing',
          url: 'https://example.com/article',
          publishedAt: new Date().toISOString(),
          source: { name: 'Mock News' }
        }
      ]
    };
  }
}
```

## Implementation Checklist

- [ ] Set up environment variables for API keys
- [ ] Implement rate limiting for each API
- [ ] Add error handling and retry logic
- [ ] Set up caching layer
- [ ] Implement data validation and sanitization
- [ ] Add monitoring and logging
- [ ] Create unit and integration tests
- [ ] Document API-specific configurations
- [ ] Set up health checks
- [ ] Implement circuit breaker pattern
- [ ] Add request/response logging
- [ ] Configure cache invalidation strategies

## Conclusion

Following these best practices ensures that your news API integrations are secure, reliable, and performant. Remember to regularly review and update your implementation as APIs evolve and new security considerations emerge.

For specific implementation examples, see the `/backend/examples/` directory (to be created) for working code samples.