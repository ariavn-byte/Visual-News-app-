const { NewsAPIClient, GDELTClient, MediaStackClient } = require('./news-clients');

/**
 * Simple in-memory cache implementation
 */
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  generateKey(service, endpoint, params) {
    const sortedParams = Object.keys(params || {})
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
      
    return `${service}:${endpoint}:${JSON.stringify(sortedParams)}`;
  }

  get(key) {
    const item = this.cache.get(key);
    if (item && item.expiry > Date.now()) {
      return item.data;
    }
    
    if (item) {
      this.cache.delete(key);
    }
    
    return null;
  }

  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * Data sanitization utilities
 */
class DataSanitizer {
  static sanitizeHtml(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '').trim();
  }

  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  static sanitizeArticle(article, source) {
    return {
      title: this.sanitizeHtml(article.title || ''),
      description: this.sanitizeHtml(article.description || ''),
      content: this.sanitizeHtml(article.content || ''),
      url: this.isValidUrl(article.url) ? article.url : null,
      publishedAt: this.normalizeDate(article.publishedAt || article.published_at),
      source: {
        name: this.sanitizeHtml(article.source?.name || 'Unknown'),
        api: source
      },
      author: this.sanitizeHtml(article.author || ''),
      urlToImage: this.isValidUrl(article.urlToImage) ? article.urlToImage : null
    };
  }

  static normalizeDate(dateString) {
    try {
      return new Date(dateString).toISOString();
    } catch (_) {
      return new Date().toISOString();
    }
  }

  static extractLocation(article) {
    // Simple location extraction - could be enhanced with NLP
    const text = `${article.title} ${article.description}`.toLowerCase();
    const locations = [];
    
    // Common Middle East locations mentioned in the current data
    const knownLocations = [
      'syria', 'iraq', 'iran', 'israel', 'palestine', 'lebanon', 'jordan',
      'turkey', 'egypt', 'saudi arabia', 'uae', 'qatar', 'bahrain', 'kuwait',
      'yemen', 'oman', 'afghanistan', 'pakistan', 'india', 'azerbaijan'
    ];
    
    knownLocations.forEach(location => {
      if (text.includes(location)) {
        locations.push(location);
      }
    });
    
    return locations;
  }
}

/**
 * News aggregation service that combines multiple APIs
 */
class NewsAggregator {
  constructor(config = {}) {
    this.cache = new CacheManager();
    this.clients = {};
    
    // Initialize clients based on available API keys
    if (config.newsApiKey) {
      this.clients.newsapi = new NewsAPIClient(config.newsApiKey);
    }
    
    if (config.mediaStackKey) {
      this.clients.mediastack = new MediaStackClient(config.mediaStackKey);
    }
    
    // GDELT doesn't require API key
    this.clients.gdelt = new GDELTClient();
    
    this.maxArticlesPerSource = config.maxArticlesPerSource || 50;
  }

  async aggregateNews(query, options = {}) {
    const cacheKey = this.cache.generateKey('aggregated', 'news', { query, ...options });
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const promises = [];
    const errors = [];

    // NewsAPI search
    if (this.clients.newsapi) {
      promises.push(
        this.clients.newsapi.searchArticles(query, {
          pageSize: Math.min(this.maxArticlesPerSource, 100),
          sortBy: 'publishedAt',
          language: options.language || 'en'
        })
        .then(data => ({ source: 'newsapi', data, success: true }))
        .catch(error => ({ source: 'newsapi', error: error.message, success: false }))
      );
    }

    // GDELT search
    promises.push(
      this.clients.gdelt.searchEvents(query, {
        maxrecords: this.maxArticlesPerSource,
        timespan: options.timespan || '3d'
      })
      .then(data => ({ source: 'gdelt', data, success: true }))
      .catch(error => ({ source: 'gdelt', error: error.message, success: false }))
    );

    // MediaStack search
    if (this.clients.mediastack) {
      promises.push(
        this.clients.mediastack.getNews({
          keywords: query,
          limit: Math.min(this.maxArticlesPerSource, 100),
          sort: 'published_desc',
          languages: options.language || 'en'
        })
        .then(data => ({ source: 'mediastack', data, success: true }))
        .catch(error => ({ source: 'mediastack', error: error.message, success: false }))
      );
    }

    const results = await Promise.allSettled(promises);
    const aggregated = this.mergeResults(results);
    
    // Cache for 5 minutes
    this.cache.set(cacheKey, aggregated, 5 * 60 * 1000);
    return aggregated;
  }

  async getNewsByCountry(country, options = {}) {
    const cacheKey = this.cache.generateKey('country', 'news', { country, ...options });
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const promises = [];

    // NewsAPI by country
    if (this.clients.newsapi) {
      promises.push(
        this.clients.newsapi.getTopHeadlines({
          country: country.toLowerCase(),
          pageSize: this.maxArticlesPerSource
        })
        .then(data => ({ source: 'newsapi', data, success: true }))
        .catch(error => ({ source: 'newsapi', error: error.message, success: false }))
      );
    }

    // GDELT by country
    promises.push(
      this.clients.gdelt.getGeoEvents(country, options.timespan || '1d')
      .then(data => ({ source: 'gdelt', data, success: true }))
      .catch(error => ({ source: 'gdelt', error: error.message, success: false }))
    );

    // MediaStack by country
    if (this.clients.mediastack) {
      promises.push(
        this.clients.mediastack.getNewsByCountry(country.toLowerCase())
        .then(data => ({ source: 'mediastack', data, success: true }))
        .catch(error => ({ source: 'mediastack', error: error.message, success: false }))
      );
    }

    const results = await Promise.allSettled(promises);
    const aggregated = this.mergeResults(results);
    
    // Cache for 10 minutes for country-specific news
    this.cache.set(cacheKey, aggregated, 10 * 60 * 1000);
    return aggregated;
  }

  mergeResults(results) {
    const merged = {
      articles: [],
      sources: [],
      errors: [],
      metadata: {
        totalSources: 0,
        successfulSources: 0,
        timestamp: new Date().toISOString()
      }
    };

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const { source, data, error, success } = result.value;
        merged.metadata.totalSources++;
        
        if (!success) {
          merged.errors.push({ source, error });
        } else {
          merged.metadata.successfulSources++;
          merged.sources.push(source);
          
          // Normalize articles from different APIs
          let articles = [];
          
          if (data.articles) {
            // NewsAPI format
            articles = data.articles;
          } else if (data.articles && Array.isArray(data.articles)) {
            // MediaStack format
            articles = data.data;
          } else if (Array.isArray(data)) {
            // GDELT format
            articles = data.slice(0, this.maxArticlesPerSource);
          }
          
          // Sanitize and add articles
          articles.forEach(article => {
            const sanitized = DataSanitizer.sanitizeArticle(article, source);
            sanitized.locations = DataSanitizer.extractLocation(sanitized);
            merged.articles.push(sanitized);
          });
        }
      }
    });

    // Remove duplicates based on URL
    const seen = new Set();
    merged.articles = merged.articles.filter(article => {
      if (!article.url || seen.has(article.url)) {
        return false;
      }
      seen.add(article.url);
      return true;
    });

    // Sort by publication date (newest first)
    merged.articles.sort((a, b) => 
      new Date(b.publishedAt) - new Date(a.publishedAt)
    );

    // Limit total articles
    merged.articles = merged.articles.slice(0, 200);

    return merged;
  }

  async getAvailableSources() {
    const sources = {
      available: [],
      configured: Object.keys(this.clients)
    };

    if (this.clients.newsapi) {
      try {
        const newsApiSources = await this.clients.newsapi.getSourcesByCountry('us');
        sources.available.push({
          api: 'newsapi',
          sources: newsApiSources.sources || []
        });
      } catch (error) {
        // Ignore errors for this endpoint
      }
    }

    return sources;
  }

  getCacheStats() {
    return {
      size: () => this.cache.size(),
      clear: () => {
        this.cache.clear();
        return 'Cache cleared';
      }
    };
  }
}

module.exports = {
  NewsAggregator,
  CacheManager,
  DataSanitizer
};