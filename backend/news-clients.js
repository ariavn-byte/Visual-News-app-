const axios = require('axios');

/**
 * Rate Limiter class to manage API request frequency
 */
class APIRateLimiter {
  constructor(requestsPerMinute = 60) {
    this.requestsPerMinute = requestsPerMinute;
    this.requests = [];
    this.queue = [];
    this.processing = false;
  }

  async makeRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      // Remove requests older than 1 minute
      this.requests = this.requests.filter(time => now - time < 60000);

      if (this.requests.length < this.requestsPerMinute) {
        const { requestFn, resolve, reject } = this.queue.shift();
        this.requests.push(now);
        
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      } else {
        // Wait before processing next request
        await this.delay(1000);
      }
    }

    this.processing = false;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Circuit Breaker pattern implementation
 */
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

/**
 * NewsAPI.org client implementation
 */
class NewsAPIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://newsapi.org/v2';
    this.rateLimiter = new APIRateLimiter(100); // Adjust based on your plan
    this.circuitBreaker = new CircuitBreaker();
  }

  async makeRequest(endpoint, params = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      params: {
        apiKey: this.apiKey,
        ...params
      },
      headers: {
        'User-Agent': 'Visual-News-Source/1.0'
      },
      timeout: 10000
    };

    return this.circuitBreaker.call(() =>
      this.rateLimiter.makeRequest(() =>
        axios.get(url, config).then(response => response.data)
      )
    );
  }

  async getTopHeadlines(params = {}) {
    const validParams = this.validateHeadlinesParams(params);
    return this.makeRequest('/top-headlines', validParams);
  }

  async searchArticles(query, params = {}) {
    if (!query || query.trim().length === 0) {
      throw new Error('Query parameter is required');
    }

    const validParams = this.validateSearchParams({ q: query, ...params });
    return this.makeRequest('/everything', validParams);
  }

  async getSourcesByCountry(country) {
    return this.makeRequest('/sources', { country });
  }

  validateHeadlinesParams(params) {
    const allowed = ['country', 'category', 'sources', 'q', 'pageSize', 'page'];
    const filtered = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (allowed.includes(key) && value !== undefined) {
        filtered[key] = value;
      }
    }

    // Validate pageSize
    if (filtered.pageSize && (filtered.pageSize < 1 || filtered.pageSize > 100)) {
      filtered.pageSize = 20;
    }

    return filtered;
  }

  validateSearchParams(params) {
    const allowed = ['q', 'sources', 'domains', 'from', 'to', 'language', 'sortBy', 'pageSize', 'page'];
    const filtered = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (allowed.includes(key) && value !== undefined) {
        filtered[key] = value;
      }
    }

    // Validate language code
    if (filtered.language && !/^[a-z]{2}$/.test(filtered.language)) {
      delete filtered.language;
    }

    // Validate pageSize
    if (filtered.pageSize && (filtered.pageSize < 1 || filtered.pageSize > 100)) {
      filtered.pageSize = 20;
    }

    return filtered;
  }
}

/**
 * GDELT Project client implementation
 */
class GDELTClient {
  constructor() {
    this.baseUrl = 'https://api.gdeltproject.org/api/v2';
    this.rateLimiter = new APIRateLimiter(1000); // GDELT is more lenient
  }

  async searchEvents(query, params = {}) {
    const url = `${this.baseUrl}/doc/doc`;
    const config = {
      params: {
        query: query,
        mode: 'artlist',
        format: 'json',
        maxrecords: 250,
        sort: 'DateDesc',
        ...params
      },
      timeout: 15000
    };

    return this.rateLimiter.makeRequest(() =>
      axios.get(url, config).then(response => response.data)
    );
  }

  async getGeoEvents(country, timeframe = '1d') {
    const query = `country:${country}`;
    return this.searchEvents(query, { timespan: timeframe });
  }

  async getThemeEvents(theme, timeframe = '3d') {
    return this.searchEvents(theme, { timespan: timeframe });
  }
}

/**
 * MediaStack client implementation
 */
class MediaStackClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'http://api.mediastack.com/v1';
    this.rateLimiter = new APIRateLimiter(100); // Adjust based on your plan
  }

  async makeRequest(endpoint, params = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      params: {
        access_key: this.apiKey,
        ...params
      },
      timeout: 10000
    };

    return this.rateLimiter.makeRequest(() =>
      axios.get(url, config).then(response => response.data)
    );
  }

  async getNews(params = {}) {
    const validParams = this.validateNewsParams(params);
    return this.makeRequest('/news', validParams);
  }

  async getNewsByCountry(countries, keywords = '') {
    return this.getNews({
      countries: Array.isArray(countries) ? countries.join(',') : countries,
      keywords: keywords,
      sort: 'published_desc',
      limit: 25
    });
  }

  validateNewsParams(params) {
    const allowed = ['keywords', 'countries', 'categories', 'languages', 'sources', 'sort', 'limit', 'offset'];
    const filtered = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (allowed.includes(key) && value !== undefined) {
        filtered[key] = value;
      }
    }

    // Validate limit
    if (filtered.limit && (filtered.limit < 1 || filtered.limit > 100)) {
      filtered.limit = 25;
    }

    return filtered;
  }
}

module.exports = {
  APIRateLimiter,
  CircuitBreaker,
  NewsAPIClient,
  GDELTClient,
  MediaStackClient
};