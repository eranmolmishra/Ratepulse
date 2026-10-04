const jwt = require('jsonwebtoken');
const env = require('../config/env');

function generateToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN || '7d',
  });
}

function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = {
  generateToken,
  verifyToken,
};
