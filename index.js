
import 'dotenv/config'; 
import express from 'express';
import { createClient } from 'redis';

const app = express();
const port = process.env.PORT || 3000;

const redisClient = createClient({
  url: process.env.REDIS_URL
});

function generateDummyUSDLKRRate() {
  const min = 300;
  const max = 350;
  return (Math.random() * (max - min) + min).toFixed(2);
}

app.get('/', (req, res) => {
    res.send('Redis API application is running. See /api/usd-rates for data.');
});


app.post('/api/fetch-usd-rate', async (_req, res) => {
  console.log('Received request to POST /api/fetch-usd-rate');
  try {
    const today = new Date();

    const dateKey = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Colombo' }))
        .toISOString()
        .slice(0, 10); 
    const rate = generateDummyUSDLKRRate();


    await redisClient.hSet('usd_rates', dateKey, rate);

    console.log(`Stored rate for ${dateKey}: ${rate}`);
    res.status(201).json({ date: dateKey, rate, message: 'Dummy rate generated and stored successfully.' });
  } catch (error) {
    console.error('Error in /api/fetch-usd-rate:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/usd-rates', async (_req, res) => {
  console.log('Received request to GET /api/usd-rates');
  try {
  
    const ratesObject = await redisClient.hGetAll('usd_rates');


    const result = Object.entries(ratesObject)
      .map(([date, rate]) => ({ date, rate }))
      .sort((a, b) => new Date(b.date) - new Date(a.date)); 
    res.json(result);
  } catch (error) {
    console.error('Error in /api/usd-rates:', error);
    res.status(500).json({ error: error.message });
  }
});


redisClient.on('connect', () => {
    console.log('Connecting to Redis...');
});

redisClient.on('ready', () => {
    console.log('✅ Successfully connected and ready to process commands.');


    setInterval(async () => {
        const reply = await redisClient.ping();
        const timestamp = new Date().toLocaleTimeString('en-LK', { timeZone: 'Asia/Colombo' });
        console.log(`[${timestamp}] Redis health check successful. Ping reply: ${reply}`);
    }, 15000); 
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));

redisClient.on('end', () => {
    console.log('Redis connection closed.');
});



(async () => {
  try {

    await redisClient.connect();
    

    app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('🔥 Failed to connect to Redis. Application will not start.', err);
    process.exit(1); 
  }
})();