import * as Joi from 'joi'

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
    PORT: Joi.number().port().required(),
    API_PREFIX: Joi.string().trim().required(),
    API_VERSION: Joi.string().trim().required()
})