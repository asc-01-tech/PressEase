// Delegate to full Express backend server
require('dotenv').config({ path: require('path').join(__dirname, 'backend/.env') });
const app = require('./backend/src/server');

module.exports = app;