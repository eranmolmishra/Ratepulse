const userRepository = require('../repositories/userRepository');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const ROLES = require('../constants/roles');

class AuthService {
  async register({ name, email, password, address }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      const error = new Error('An account with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await userRepository.create({
      name,
      email,
      password: hashedPassword,
      address,
      role: ROLES.USER,
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        address: newUser.address,
        role: newUser.role,
      },
      token,
    };
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
      },
      token,
    };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      const error = new Error('Current password does not match');
      error.statusCode = 400;
      throw error;
    }

    if (currentPassword === newPassword) {
      const error = new Error('New password must be different from current password');
      error.statusCode = 400;
      throw error;
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await userRepository.updatePassword(userId, hashedNewPassword);

    return { message: 'Password updated successfully' };
  }

  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }
}

module.exports = new AuthService();
