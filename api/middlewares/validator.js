import { BadRequest } from '../lib/http.js'

export const validateRequest = (schemas) => (req, res, next) => {
  let errors = {}
  for (const key of ['body', 'params', 'query', 'headers']) {
    if (schemas[key] && req[key]) {
      const result = schemas[key].safeParse(req[key])
      if (!result.success) {
        
        result.error.errors.forEach((error) => {
          errors[error.path[0]] = error.message;
        });

        return next(new BadRequest(errors));
      }
    }
  }
  next()
}