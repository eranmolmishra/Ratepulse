const VALIDATION_RULES = Object.freeze({
  NAME: {
    MIN_LENGTH: 20,
    MAX_LENGTH: 60,
  },
  ADDRESS: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 400,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 16,
    UPPERCASE_REGEX: /[A-Z]/,
    SPECIAL_CHAR_REGEX: /[!@#$%^&*(),.?":{}|<>_~+=\-\[\]\\\/]/,
  },
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  RATING: {
    MIN: 1,
    MAX: 5,
  },
});

module.exports = VALIDATION_RULES;
