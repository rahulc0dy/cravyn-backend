import ApiError from "./apiError.js";

/**
 * Utility function to validate required fields.
 * @param {Object} fields - An object with field names as keys and their values to validate.
 */
const checkRequiredFields = (fields) => {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) {
      const message = `${camelToSentenceCase(key)} is required.`;
      const reason = `${key} is ${value}`;
      throw new ApiError(400, message, reason);
    }
  }
  return true;
};

/**
 * Converts a camelCase string to sentence case.
 * @param {string} str - The camelCase string.
 * @returns {string} The string in sentence case.
 */
const camelToSentenceCase = (str) => {
  if (!str) return str;
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
};

export { checkRequiredFields };
