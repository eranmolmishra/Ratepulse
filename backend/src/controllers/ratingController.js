const ratingService = require('../services/ratingService');
const { successResponse } = require('../utils/response');

class RatingController {
  async submitRating(req, res, next) {
    try {
      const storeId = parseInt(req.params.storeId, 10);
      const rating = parseInt(req.body.rating, 10);
      const userId = req.user.id;

      const result = await ratingService.submitRating({
        userId,
        storeId,
        rating,
      });

      return successResponse(res, result, 'Rating submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async modifyRating(req, res, next) {
    try {
      const storeId = parseInt(req.params.storeId, 10);
      const rating = parseInt(req.body.rating, 10);
      const userId = req.user.id;

      const result = await ratingService.modifyRating({
        userId,
        storeId,
        rating,
      });

      return successResponse(res, result, 'Rating modified successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RatingController();
