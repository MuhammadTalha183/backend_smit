const http = require('node:http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  // Check the URL and HTTP method
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Welcome to the Home Page!');
  } 
  else if (req.url === '/about' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('This is the About Page.');
  } 
  else if (req.url === '/api/user' && req.method === 'GET') {
    // Example of sending JSON data
    const user = { id: 1, name: 'Ali', role: 'Developer' };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(user));
  } 
  else {
    // Handle 404 Not Found
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 - Page Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
