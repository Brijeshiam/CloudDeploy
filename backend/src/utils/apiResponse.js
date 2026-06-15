'use strict';

/**
 * src/utils/apiResponse.js
 * Standardized API response helpers.
 * Every API response follows: { success, message, data?, errors?, meta? }
 */

/**
 * success
 * Send a successful JSON response.
 *
 * @param {import('express').Response} res
 * @param {*} data         Response payload
 * @param {string} message Human-readable message
 * @param {number} code    HTTP status code (default 200)
 * @param {object} meta    Optional metadata (pagination, etc.)
 */
function success(res, data = null, message = 'Success', code = 200, meta = null) {
  const body = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    body.data = data;
  }

  if (meta) {
    body.meta = meta;
  }

  return res.status(code).json(body);
}

/**
 * error
 * Send an error JSON response.
 *
 * @param {import('express').Response} res
 * @param {string} message  Human-readable error message
 * @param {number} code     HTTP status code (default 500)
 * @param {Array}  errors   Optional array of field-level errors
 */
function error(res, message = 'Internal Server Error', code = 500, errors = null) {
  const body = {
    success: false,
    message,
  };

  if (errors) {
    body.errors = errors;
  }

  return res.status(code).json(body);
}

/**
 * paginated
 * Convenience wrapper for paginated list responses.
 *
 * @param {import('express').Response} res
 * @param {Array}   items
 * @param {number}  total    Total count across all pages
 * @param {number}  page     Current page (1-indexed)
 * @param {number}  limit    Items per page
 * @param {string}  message
 */
function paginated(res, items, total, page, limit, message = 'Success') {
  const totalPages = Math.ceil(total / limit);

  return success(
    res,
    items,
    message,
    200,
    {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }
  );
}

module.exports = { success, error, paginated };
