const ROLES = require('../constants/roles');
const {
  validateName,
  validateEmail,
  validateAddress,
  validatePassword,
} = require('./authValidator');

function validateCreateUser(req, res, next) {
  const { name, email, password, address, role } = req.body;
  const errors = {};

  const nameError = validateName(name);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  const addressError = validateAddress(address);
  if (addressError) errors.address = addressError;

  if (!role || !Object.values(ROLES).includes(role)) {
    errors.role = `Role must be one of: ${Object.values(ROLES).join(', ')}`;
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
}

module.exports = {
  validateCreateUser,
};
