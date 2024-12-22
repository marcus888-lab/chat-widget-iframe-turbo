const express = require('express');
const path = require('path');
const app = express();

// Serve static files from public directory
app.use(express.static('public'));
// Serve the dist directory for the iframe build
app.use('/dist', express.static('dist'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Demo page: http://localhost:${PORT}/demo.html`);
  console.log(`Widget page: http://localhost:${PORT}/widget.html`);
});
