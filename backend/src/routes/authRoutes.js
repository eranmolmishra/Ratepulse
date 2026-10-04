const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');
const {
  validateRegistration,
  validateLogin,
  validatePasswordUpdate,
} = require('../validators/authValidator');

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);

// Authenticated routes
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getMe);
router.put('/password', authenticateToken, validatePasswordUpdate, authController.changePassword);

module.exports = router;
