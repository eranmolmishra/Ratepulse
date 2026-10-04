const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const ROLES = require('../constants/roles');
const { validateCreateUser } = require('../validators/userValidator');
const { validateCreateStore } = require('../validators/storeValidator');

// Protect all admin routes with authentication and ADMIN role check
router.use(authenticateToken);
router.use(authorizeRoles(ROLES.ADMIN));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', validateCreateUser, adminController.createUser);
router.get('/stores', adminController.getStores);
router.post('/stores', validateCreateStore, adminController.createStore);

module.exports = router;
