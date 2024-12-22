const express = require('express');
const path = require('path');
const app = express();

// Serve static files from public directory
app.use(express.static('public'));
// Serve the dist directory for the iframe build
app.use('/dist', express.static('dist'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  console.log(`Demo page: http://0.0.0.0:${PORT}/demo.html`);
  console.log(`Widget page: http://0.0.0.0:${PORT}/widget.html`);
});
