const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./db/db');
const config = require('./config/config');

// Load env vars
dotenv.config({ path: './.env' });

// Connect to database
connectDB();

const app = express();

// Middleware
// Configure CORS to explicitly allow your frontend's origin
// This is crucial to prevent "Access-Control-Allow-Origin" errors
app.use(cors({
  origin: 'https://scheduler-pkxg.onrender.com' // Replace with your actual frontend URL
}));

app.use(express.json()); // Body parser for JSON data

// Import routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
