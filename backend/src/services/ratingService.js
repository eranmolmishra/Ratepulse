const ratingRepository = require('../repositories/ratingRepository');
const storeRepository = require('../repositories/storeRepository');

class RatingService {
  async submitRating({ userId, storeId, rating }) {
    // 1. Verify store exists
    const store = await storeRepository.findById(storeId);
    if (!store) {
      const error = new Error('Store not found');
      error.statusCode = 404;
      throw error;
    }

    // 2. Check if user already submitted rating for this store
    const existing = await ratingRepository.findByUserAndStore(userId, storeId);
    if (existing) {
      const error = new Error('You have already submitted a rating for this store. Please update your existing rating instead.');
      error.statusCode = 400;
      throw error;
    }

    // 3. Create rating
    const createdRating = await ratingRepository.create({ userId, storeId, rating });

    // 4. Retrieve updated store rating summary
    const storeSummary = await ratingRepository.getStoreRatingSummary(storeId);

    return {
      rating: createdRating,
      store: {
        id: store.id,
        name: store.name,
        overall_rating: storeSummary.overall_rating,
        total_ratings: storeSummary.total_ratings,
      },
    };
  }

  async modifyRating({ userId, storeId, rating }) {
    // 1. Verify store exists
    const store = await storeRepository.findById(storeId);
    if (!store) {
      const error = new Error('Store not found');
      error.statusCode = 404;
      throw error;
    }

    // 2. Check if user has an existing rating for this store
    const existing = await ratingRepository.findByUserAndStore(userId, storeId);
    if (!existing) {
      const error = new Error('No existing rating found for this store. Please submit a new rating first.');
      error.statusCode = 404;
      throw error;
    }

    // 3. Update rating
    const updatedRating = await ratingRepository.update({ userId, storeId, rating });

    // 4. Retrieve updated store rating summary
    const storeSummary = await ratingRepository.getStoreRatingSummary(storeId);

    return {
      rating: updatedRating,
      store: {
        id: store.id,
        name: store.name,
        overall_rating: storeSummary.overall_rating,
        total_ratings: storeSummary.total_ratings,
      },
    };
  }
}

module.exports = new RatingService();
