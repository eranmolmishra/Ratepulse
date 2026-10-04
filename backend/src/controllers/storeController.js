const storeService = require('../services/storeService');
const { successResponse } = require('../utils/response');

class StoreController {
  async getStores(req, res, next) {
    try {
      const { name, address, search, sortBy, sortOrder } = req.query;

      // Support either specific query params or unified search query
      const storeName = name || search;
      const storeAddress = address || search;

      // If search is provided, we can search both name and address
      const stores = await storeService.getStoresForUser({
        name: search ? null : name,
        address: search ? null : address,
        userId: req.user.id,
        sortBy,
        sortOrder,
      });

      // If search query is provided, apply multi-field filter
      let filteredStores = stores;
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        filteredStores = stores.filter(
          (s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
        );
      }

      return successResponse(res, { stores: filteredStores }, 'Stores retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getStoreById(req, res, next) {
    try {
      const { id } = req.params;
      const store = await storeService.getStoreById(id);
      return successResponse(res, { store }, 'Store retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StoreController();
