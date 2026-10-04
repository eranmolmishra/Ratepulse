const authService = require('../services/authService');
const { successResponse } = require('../utils/response');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password, address } = req.body;
      const result = await authService.register({ name, email, password, address });
      return successResponse(res, result, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      // Token-based logout on backend: client destroys token
      return successResponse(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
      return successResponse(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      return successResponse(res, { user }, 'User profile retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
