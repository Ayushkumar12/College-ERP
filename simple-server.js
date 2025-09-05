const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Simple server is running'
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'ERP Server is running!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on http://localhost:${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

// Keep the process running
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});