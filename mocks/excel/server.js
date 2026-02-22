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

// Prime a response for a specific endpoint
app.post('/prime', (req, res) => {
  const { endpoint, method = 'POST', response, status = 200, delay = 0, error, binary } = req.body;
  const key = `${method}:${endpoint}`;
  primedResponses[key] = { response, status, delay, error, binary };
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

// Excel generation endpoint
app.post('/generate', async (req, res) => {
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
    if (primed.binary) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(Buffer.from(primed.response, 'base64'));
    }
    return res.status(primed.status).json(primed.response);
  }

  // Default: return a minimal valid xlsx (empty workbook)
  // This is a base64-encoded minimal xlsx file
  const minimalXlsx = 'UEsDBBQAAAAIAAAAAACYPuEIXQAAAGIAAAALAAAAX3JlbHMvLnJlbHONz7EKwjAQBuC9T3Fk79K6iEjTLuLgKvgAIbmmoU0u5C7a+vYGwcFFx/v+/7tLub1PSzbTJC6whrzIISOOPjgeMhyP+7sNZDLIzNGT4sGk6sqbVXmgyMYOqMZJqmKYxJg+a61xpIRSeI/sktZPCaUdp0F7HDEMpO+L4l1PM4N5afLi0Ud5FMDdvPHJkLg6rPkHXL8AAAD//wMAUEsDBBQAAAAIAAAAAABHHOOcVwAAAJYAAAAPAAAAeGwvd29ya2Jvb2sueG1sjc5BDoIwEAXQvacoc0ApxoiJwIqFa/cNDNiBJkJLplXx9kIi7lz+N/+byXc/nG/iQc6TMwpmCYKghm3l+gJO53JaQ+bZuNrciGOBT/IwJEqKzj68p+5j7KyHAk3rRxhC6hnD0JAyIqLk1AX0wBGbV0tOi5bAm9HzEOYRwuLnc/v+JYkvAAAA//8DAFBLAwQUAAAACAAAAAAArIIjSTkAAACAAAAACwAAAHhsL3N0eWxlcy54bWxlzrEKgDAMBdC9XxGyW+vi4ij4A+LuUGoNtLTQ1KJ/b3URnC7hPR5J+wfMlQy4e5fA0kBKPE+o2cqSxz4nGVgEDhGlqTLuwMGhfRkl7X8lw//MzgAAAP//AwBQSwMEFAAAAAgAAAAAADJ1O88zAAAAQQAAABAAAAB4bC9zaGFyZWRTdHJpbmdzLnhtbLOxr8jNUShLLSrOUNBRKC4pysxLL84vLlGwVQYAAAD//wMAUEsDBBQAAAAIAAAAAAB9w9xufwAAALsAAAAYAAAAeGwvd29ya3NoZWV0cy9zaGVldDEueG1sjc7BCoMwDAbgu+A7lNxdnYchInp0sLO38AxSWmnBtqWpqG9vERzs5C359/8hST/e38lIOKdzFWc9loxVfFKuifD8OpSAJYVmCvIMJDEMWBR8MgODRyHqfOmMC7AnNZXw68mJxe0hws62FsrSahhZPHy9nO4fAAAA//8DAFBLAwQUAAAACAAAAAAAT5GGjIEAAACxAAAAEwAAAFtDb250ZW50X1R5cGVzXS54bWyVzrEKwjAQgOG9TxEyt9SBQURalgouLuIDXNNrEkxyyZ1afXtTQHQQHIf7+fhJvbs5mw0UKEkE3KgGMxI+6SRDwJdiABvLuTwdSYadq0HMJOlOCPIjOeQqJZL6Y0rhkOs9DzKhvuJAYtu2kJFg7hF3sgfh/AB38cxlwwHzBpf+NJ2P0T9cNHkQAAAA//8DAFBLAQItABQAAAAIAAAAAACYPuEIXQAAAGIAAAALAAAAAAAAAAAAAAAAAAAAAABfcmVscy8ucmVsc1BLAQItABQAAAAIAAAAAABHHOOcVwAAAJYAAAAPAAAAAAAAAAAAAAAAAIYAAAB4bC93b3JrYm9vay54bWxQSwECLQAUAAAACAAAAAAArIIjSTkAAACAAAAAGwAAAAAAAAAAAAAAAAAKAQAAeGwvX3JlbHMvd29ya2Jvb2sueG1sLnJlbHNQSwECLQAUAAAACAAAAAAArIIjSTkAAACAAAAACwAAAAAAAAAAAAAAAABuAQAAeGwvc3R5bGVzLnhtbFBLAQItABQAAAAIAAAAAAAydTvPMwAAAEEAAAAQAAAAAAAAAAAAAAAAANABAAB4bC9zaGFyZWRTdHJpbmdzLnhtbFBLAQItABQAAAAIAAAAAAB9w9xufwAAALsAAAAYAAAAAAAAAAAAAAAAADECAAB4bC93b3Jrc2hlZXRzL3NoZWV0MS54bWxQSwECLQAUAAAACAAAAAAAT5GGjIEAAACxAAAAEwAAAAAAAAAAAAAAAADmAgAAW0NvbnRlbnRfVHlwZXNdLnhtbFBLBQYAAAAABwAHAMgBAACYAwAAAAA=';

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="export.xlsx"');
  res.send(Buffer.from(minimalXlsx, 'base64'));
});

// Catch-all for other Excel service endpoints
app.all('/*', async (req, res) => {
  const endpoint = req.path;
  const method = req.method;
  const key = `${method}:${endpoint}`;

  recordedCalls.push({
    endpoint,
    method,
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

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

  res.json({ success: true, endpoint, method });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Excel mock server running on port ${PORT}`);
});
