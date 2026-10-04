const { verifyToken } = require('../utils/jwt');
const userRepository = require('../repositories/userRepository');

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required: missing or invalid authorization header',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Check user still exists in database
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication internal error',
    });
  }
}

module.exports = authenticateToken;
