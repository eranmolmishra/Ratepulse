const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const ratingController = require('../controllers/ratingController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const ROLES = require('../constants/roles');
const { validateRatingInput } = require('../validators/ratingValidator');

// Protect all store routes with authentication
router.use(authenticateToken);

// Stores listing and details
router.get('/', storeController.getStores);
router.get('/:id', storeController.getStoreById);

// Ratings submission and modification (only NORMAL USER role)
router.post(
  '/:storeId/ratings',
  authorizeRoles(ROLES.USER),
  validateRatingInput,
  ratingController.submitRating
);

router.put(
  '/:storeId/ratings',
  authorizeRoles(ROLES.USER),
  validateRatingInput,
  ratingController.modifyRating
);

module.exports = router;
