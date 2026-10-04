const {
  validateName,
  validateEmail,
  validateAddress,
} = require('./authValidator');

function validateCreateStore(req, res, next) {
  const { name, email, address } = req.body;
  const errors = {};

  const nameError = validateName(name);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

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

module.exports = {
  validateCreateStore,
};
