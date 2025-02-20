import { BadRequest } from '../lib/http.js'

export const validateRequest = (schemas) => (req, res, next) => {
  for (const key of ['body', 'params', 'query', 'headers']) {
    if (schemas[key] && req[key]) {
      const result = schemas[key].safeParse(req[key])
      if (!result.success) {
        const error = result.error.errors[0]
        return next(new BadRequest({ message: `${error.path[0]} ${error.message.toLowerCase()}` }))
      }
    }
  }
  next()
}