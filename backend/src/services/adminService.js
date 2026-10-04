const userRepository = require('../repositories/userRepository');
const storeRepository = require('../repositories/storeRepository');
const ratingRepository = require('../repositories/ratingRepository');
const { hashPassword } = require('../utils/password');

class AdminService {
  async getDashboardStats() {
    const [totalUsers, totalStores, totalRatings] = await Promise.all([
      userRepository.countAll(),
      storeRepository.countAll(),
      ratingRepository.countAll(),
    ]);

    return {
      totalUsers,
      totalStores,
      totalRatings,
    };
  }

  async getUsers(params) {
    return await userRepository.findAll(params);
  }

  async getUserById(id) {
    const user = await userRepository.getUserDetailsWithStore(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  async createUser({ name, email, password, address, role }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      const error = new Error('A user with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await userRepository.create({
      name,
      email,
      password: hashedPassword,
      address,
      role,
    });

    return newUser;
  }

  async getStores(params) {
    return await storeRepository.findAllAdmin(params);
  }

  async createStore({ name, email, address, owner_id = null }) {
    const existing = await storeRepository.findByEmail(email);
    if (existing) {
      const error = new Error('A store with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    if (owner_id) {
      const owner = await userRepository.findById(owner_id);
      if (!owner) {
        const error = new Error('Selected store owner does not exist');
        error.statusCode = 400;
        throw error;
      }
    }

    const newStore = await storeRepository.create({
      name,
      email,
      address,
      owner_id,
    });

    return newStore;
  }
}

module.exports = new AdminService();
