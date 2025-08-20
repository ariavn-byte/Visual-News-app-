/**
 * Simple test script to verify news API integration
 * Run with: node test-apis.js
 */

require('dotenv').config();
const { NewsAggregator } = require('./news-aggregator');
const { NewsAPIClient, GDELTClient, MediaStackClient } = require('./news-clients');

async function testAPIs() {
  console.log('🧪 Testing News API Integration...\n');

  // Test GDELT (no API key required)
  console.log('📰 Testing GDELT API...');
  try {
    const gdeltClient = new GDELTClient();
    const results = await gdeltClient.searchEvents('syria', { maxrecords: 5 });
    console.log(`✅ GDELT: Successfully fetched ${Array.isArray(results) ? results.length : 'unknown'} results`);
  } catch (error) {
    console.log(`❌ GDELT: ${error.message}`);
  }

  // Test NewsAPI (if key is provided)
  if (process.env.NEWS_API_KEY && process.env.NEWS_API_KEY !== 'YOUR_NEWSAPI_KEY_HERE') {
    console.log('\n📺 Testing NewsAPI...');
    try {
      const newsClient = new NewsAPIClient(process.env.NEWS_API_KEY);
      const results = await newsClient.getTopHeadlines({ pageSize: 5 });
      console.log(`✅ NewsAPI: Successfully fetched ${results.articles?.length || 0} articles`);
    } catch (error) {
      console.log(`❌ NewsAPI: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  NewsAPI: No API key configured (set NEWS_API_KEY in .env)');
  }

  // Test MediaStack (if key is provided)
  if (process.env.MEDIASTACK_API_KEY && process.env.MEDIASTACK_API_KEY !== 'YOUR_MEDIASTACK_KEY_HERE') {
    console.log('\n📡 Testing MediaStack...');
    try {
      const mediaClient = new MediaStackClient(process.env.MEDIASTACK_API_KEY);
      const results = await mediaClient.getNews({ limit: 5 });
      console.log(`✅ MediaStack: Successfully fetched ${results.data?.length || 0} articles`);
    } catch (error) {
      console.log(`❌ MediaStack: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  MediaStack: No API key configured (set MEDIASTACK_API_KEY in .env)');
  }

  // Test News Aggregator
  console.log('\n🔗 Testing News Aggregator...');
  try {
    const aggregator = new NewsAggregator({
      newsApiKey: process.env.NEWS_API_KEY,
      mediaStackKey: process.env.MEDIASTACK_API_KEY
    });

    const results = await aggregator.aggregateNews('middle east', { timespan: '1d' });
    console.log(`✅ Aggregator: Combined ${results.articles.length} articles from ${results.sources.length} sources`);
    
    if (results.errors.length > 0) {
      console.log(`⚠️  Aggregator: ${results.errors.length} sources had errors:`, 
        results.errors.map(e => `${e.source}: ${e.error}`).join(', '));
    }

    // Test cache
    const cacheStats = aggregator.getCacheStats();
    console.log(`📦 Cache: ${cacheStats.size()} items cached`);

  } catch (error) {
    console.log(`❌ Aggregator: ${error.message}`);
  }

  console.log('\n✅ API integration tests completed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Set up your API keys in backend/.env');
  console.log('   2. Start the server: npm start');
  console.log('   3. Test the endpoints:');
  console.log('      - GET /api/health/news');
  console.log('      - GET /api/news/search?q=syria');
  console.log('      - GET /api/news/country/us');
}

// Run tests
testAPIs().catch(console.error);