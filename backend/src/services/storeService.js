const storeRepository = require('../repositories/storeRepository');

class StoreService {
  async getStoresForUser({ name, address, userId, sortBy, sortOrder }) {
    return await storeRepository.findAllUser({
      name,
      address,
      currentUserId: userId,
      sortBy,
      sortOrder,
    });
  }

  async getStoreById(storeId) {
    const store = await storeRepository.findById(storeId);
    if (!store) {
      const error = new Error('Store not found');
      error.statusCode = 404;
      throw error;
    }
    return store;
  }
}

module.exports = new StoreService();
