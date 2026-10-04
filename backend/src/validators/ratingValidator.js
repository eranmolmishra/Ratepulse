const VALIDATION_RULES = require('../constants/validationRules');

function validateRatingInput(req, res, next) {
  const { rating } = req.body;
  const errors = {};

  const num = Number(rating);
  if (rating === undefined || rating === null || isNaN(num)) {
    errors.rating = 'Rating is required and must be a number';
  } else if (!Number.isInteger(num)) {
    errors.rating = 'Rating must be an integer';
  } else if (num < VALIDATION_RULES.RATING.MIN || num > VALIDATION_RULES.RATING.MAX) {
    errors.rating = `Rating must be between ${VALIDATION_RULES.RATING.MIN} and ${VALIDATION_RULES.RATING.MAX}`;
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
  validateRatingInput,
};
