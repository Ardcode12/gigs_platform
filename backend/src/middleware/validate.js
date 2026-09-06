import { ApiError } from '../utils/ApiError.js';

/**
 * Validates req.body against a Zod schema and replaces it with the parsed
 * result, so controllers receive trimmed and correctly typed values.
 */
export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return next(ApiError.badRequest('Please correct the highlighted fields.', details));
  }

  req.body = result.data;
  next();
};
