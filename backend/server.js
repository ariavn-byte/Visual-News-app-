// Load environment variables from .env file
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();

// Middlewares
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable parsing of JSON request bodies

// Define a port, with a fallback for production environments
const PORT = process.env.PORT || 3000;

// --- API Routes ---

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Server is running' });
});

// --- Start the server ---
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
