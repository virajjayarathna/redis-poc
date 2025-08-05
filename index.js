// 1. Import necessary packages
const express = require('express');
const redis = require('redis');
require('dotenv').config(); // This loads the .env file contents into process.env

// 2. Configuration
const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
    console.error("Error: REDIS_URL is not defined in the .env file.");
    process.exit(1); // Exit the application if Redis URL is not set
}

// 3. Initialize Express App
const app = express();

// 4. Create and Configure Redis Client
console.log('Attempting to connect to Redis...');
const redisClient = redis.createClient({
    url: REDIS_URL
});

// --- Redis Client Event Listeners ---
redisClient.on('connect', () => {
    console.log('Connecting to Redis...');
});

redisClient.on('ready', () => {
    console.log('✅ Successfully connected to Redis!');

    // --- Start the periodic check ---
    // This will run every 15 seconds to confirm the connection is live
    setInterval(async () => {
        try {
            const reply = await redisClient.ping();
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] Ping to Redis successful. Reply: ${reply}`);
        } catch (err) {
            console.error('Error during periodic Redis ping:', err);
        }
    }, 15000); // 15000 milliseconds = 15 seconds
});

redisClient.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});

redisClient.on('end', () => {
    console.log('Redis connection closed.');
});

// 5. Connect to Redis
// We wrap this in an async function to handle the connection promise
const connectToRedis = async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
        // If initial connection fails, you might want to exit or retry
        process.exit(1);
    }
};

connectToRedis();

// 6. Define a simple route for the web server
app.get('/', (req, res) => {
    res.send('Redis POC application is running. Check the console for connection status.');
});

// 7. Start the server
app.listen(PORT, () => {
    console.log(`Node.js server is running on port ${PORT}`);
});