// Vercel Serverless Entry Point
const app = require('./dist/index.js');
const serverless = require('serverless-http');

module.exports = serverless(app);
