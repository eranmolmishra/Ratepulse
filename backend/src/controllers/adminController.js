const adminService = require('../services/adminService');
const { successResponse } = require('../utils/response');

class AdminController {
  async getDashboard(req, res, next) {
    try {
      const stats = await adminService.getDashboardStats();
      return successResponse(res, stats, 'Dashboard statistics retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req, res, next) {
    try {
      const { name, email, address, role, sortBy, sortOrder } = req.query;
      const users = await adminService.getUsers({
        name,
        email,
        address,
        role,
        sortBy,
        sortOrder,
      });
      return successResponse(res, { users }, 'Users list retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await adminService.getUserById(id);
      return successResponse(res, { user }, 'User details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const { name, email, password, address, role } = req.body;
      const newUser = await adminService.createUser({
        name,
        email,
        password,
        address,
        role,
      });
      return successResponse(res, { user: newUser }, 'User created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getStores(req, res, next) {
    try {
      const { name, email, address, sortBy, sortOrder } = req.query;
      const stores = await adminService.getStores({
        name,
        email,
        address,
        sortBy,
        sortOrder,
      });
      return successResponse(res, { stores }, 'Stores list retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createStore(req, res, next) {
    try {
      const { name, email, address, owner_id } = req.body;
      const newStore = await adminService.createStore({
        name,
        email,
        address,
        owner_id: owner_id ? parseInt(owner_id, 10) : null,
      });
      return successResponse(res, { store: newStore }, 'Store created successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
