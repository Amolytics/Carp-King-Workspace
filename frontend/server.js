const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// simple request logger
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url, 'from', req.ip);
  next();
});

// serve static build
const staticDir = path.join(__dirname, 'dist');
app.use(express.static(staticDir));

// catch-all to support SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});

module.exports = app;
