// config-demo.js — reading configuration from environment variables.
//
// No Express, no server, no dependencies: just process.env with defaults.
// This is the pattern every later topic uses to read PORT, NODE_ENV and
// APP_NAME, so the server file itself never hard-codes a value that
// changes between your laptop, a teammate's laptop, and production.
//
// Run it (from the topic folder):
//   NODE_PATH=/tmp/express-verify/node_modules node examples/config-demo.js
// Try overriding a value, e.g.:
//   APP_NAME=my-api NODE_ENV=production node examples/config-demo.js

const config = {
  appName: process.env.APP_NAME || 'backend-journey-app',
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
};

console.log('Resolved config:');
console.log(config);
console.log(`App "${config.appName}" would run on port ${config.port} in ${config.nodeEnv} mode.`);
