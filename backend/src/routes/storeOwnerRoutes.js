const express = require('express');
const router = express.Router();
const storeOwnerController = require('../controllers/storeOwnerController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const ROLES = require('../constants/roles');

// Protect all store-owner routes with authentication and STORE_OWNER role check
router.use(authenticateToken);
router.use(authorizeRoles(ROLES.STORE_OWNER));

router.get('/dashboard', storeOwnerController.getDashboard);

module.exports = router;
