const storeOwnerService = require('../services/storeOwnerService');
const { successResponse } = require('../utils/response');

class StoreOwnerController {
  async getDashboard(req, res, next) {
    try {
      const dashboard = await storeOwnerService.getDashboard(req.user.id, req.user.email);
      return successResponse(res, dashboard, 'Store owner dashboard retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StoreOwnerController();
