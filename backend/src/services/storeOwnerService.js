const ratingRepository = require('../repositories/ratingRepository');

class StoreOwnerService {
  async getDashboard(userId, userEmail) {
    const dashboardData = await ratingRepository.getStoreOwnerDashboard(userId, userEmail);
    if (!dashboardData) {
      return {
        hasStore: false,
        message: 'No store registered for this store owner account yet. Please contact the administrator.',
        store: null,
        average_rating: 0,
        total_ratings: 0,
        ratings: [],
      };
    }

    return {
      hasStore: true,
      ...dashboardData,
    };
  }
}

module.exports = new StoreOwnerService();
