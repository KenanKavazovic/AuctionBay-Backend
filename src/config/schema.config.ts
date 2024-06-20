import Joi from 'joi';

export const configValidationSchema = Joi.object({

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_SECRET_EXPIRES: Joi.number().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET_EXPIRES: Joi.number().required(),
})
