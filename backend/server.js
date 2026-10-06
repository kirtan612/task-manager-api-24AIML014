// server.js entry point delegating to server_new.js
// This ensures that running 'npm run dev', 'npm start', or 'node server.js' runs the full MongoDB application
require('./server_new');