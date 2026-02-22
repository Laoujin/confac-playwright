const express = require('express');
const app = express();
app.use(express.json());

// Stateful storage
let primedResponses = {};
let recordedCalls = [];

// Reset state
app.post('/reset', (req, res) => {
  primedResponses = {};
  recordedCalls = [];
  res.json({ status: 'reset' });
});

// Prime a response for a specific endpoint/method
// POST /prime { endpoint: '/orders', method: 'POST', response: {...}, status: 200 }
app.post('/prime', (req, res) => {
  const { endpoint, method = 'POST', response, status = 200, delay = 0, error } = req.body;
  const key = `${method}:${endpoint}`;
  primedResponses[key] = { response, status, delay, error };
  res.json({ status: 'primed', key });
});

// Get all recorded calls
app.get('/calls', (req, res) => {
  res.json(recordedCalls);
});

// Get calls for a specific endpoint
app.get('/calls/:endpoint(*)', (req, res) => {
  const endpoint = '/' + req.params.endpoint;
  const filtered = recordedCalls.filter(c => c.endpoint === endpoint);
  res.json(filtered);
});

// Clear recorded calls
app.delete('/calls', (req, res) => {
  recordedCalls = [];
  res.json({ status: 'cleared' });
});

// Catch-all handler for Billit/Peppol API simulation
app.all('/v1/*', async (req, res) => {
  const endpoint = req.path;
  const method = req.method;
  const key = `${method}:${endpoint}`;

  // Record the call
  recordedCalls.push({
    endpoint,
    method,
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  // Check for primed response
  const primed = primedResponses[key];
  if (primed) {
    if (primed.delay) {
      await new Promise(resolve => setTimeout(resolve, primed.delay));
    }
    if (primed.error) {
      return res.status(primed.status || 500).json({ error: primed.error });
    }
    return res.status(primed.status).json(primed.response);
  }

  // Default success response
  res.json({
    success: true,
    message: `Mock response for ${method} ${endpoint}`,
    requestBody: req.body
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Peppol/Billit mock server running on port ${PORT}`);
});
