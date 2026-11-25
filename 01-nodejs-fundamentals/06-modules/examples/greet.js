// greet.js — a local module.
// One file, one job: build a greeting string.
// Whatever a module assigns to module.exports is what require() returns.
function greet(name) {
  return 'Hello, ' + name + ' — welcome to Node.js modules!';
}

module.exports = greet;
