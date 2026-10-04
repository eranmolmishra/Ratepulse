const VALIDATION_RULES = require('../constants/validationRules');

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return 'Email is required';
  }
  const trimmed = email.trim();
  if (!VALIDATION_RULES.EMAIL.REGEX.test(trimmed)) {
    return 'Invalid email address format';
  }
  return null;
}

function validateName(name) {
  if (!name || typeof name !== 'string') {
    return 'Name is required';
  }
  const trimmed = name.trim();
  if (trimmed.length < VALIDATION_RULES.NAME.MIN_LENGTH) {
    return `Name must be at least ${VALIDATION_RULES.NAME.MIN_LENGTH} characters long`;
  }
  if (trimmed.length > VALIDATION_RULES.NAME.MAX_LENGTH) {
    return `Name cannot exceed ${VALIDATION_RULES.NAME.MAX_LENGTH} characters`;
  }
  return null;
}

function validateAddress(address) {
  if (!address || typeof address !== 'string') {
    return 'Address is required';
  }
  const trimmed = address.trim();
  if (trimmed.length === 0) {
    return 'Address cannot be empty';
  }
  if (trimmed.length > VALIDATION_RULES.ADDRESS.MAX_LENGTH) {
    return `Address cannot exceed ${VALIDATION_RULES.ADDRESS.MAX_LENGTH} characters`;
  }
  return null;
}

function validatePassword(password, fieldName = 'Password') {
  if (!password || typeof password !== 'string') {
    return `${fieldName} is required`;
  }
  if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    return `${fieldName} must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters long`;
  }
  if (password.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
    return `${fieldName} cannot exceed ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters`;
  }
  if (!VALIDATION_RULES.PASSWORD.UPPERCASE_REGEX.test(password)) {
    return `${fieldName} must contain at least one uppercase letter`;
  }
  if (!VALIDATION_RULES.PASSWORD.SPECIAL_CHAR_REGEX.test(password)) {
    return `${fieldName} must contain at least one special character`;
  }
  return null;
}

function validateRegistration(req, res, next) {
  const { name, email, password, address } = req.body;
  const errors = {};

  const nameError = validateName(name);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  const addressError = validateAddress(address);
  if (addressError) errors.address = addressError;

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required';
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

function validatePasswordUpdate(req, res, next) {
  const { currentPassword, newPassword } = req.body;
  const errors = {};

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.currentPassword = 'Current password is required';
  }

  const newPasswordError = validatePassword(newPassword, 'New password');
  if (newPasswordError) {
    errors.newPassword = newPasswordError;
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
  validateEmail,
  validateName,
  validateAddress,
  validatePassword,
  validateRegistration,
  validateLogin,
  validatePasswordUpdate,
};
