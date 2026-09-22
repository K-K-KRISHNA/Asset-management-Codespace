import * as Joi from 'joi'

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
    PORT: Joi.number().port().required(),
    API_PREFIX: Joi.string().trim().required(),
    API_VERSION: Joi.string().trim().required(),

    ENVIRONMENT: Joi.string()
        .required(),

    SERVICE_NAME: Joi.string()
        .required(),

    LOG_TRANSPORTS: Joi.string()
        .default('console'),

    LOG_LEVEL: Joi.string()
        .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
        .default('info'),

    LOG_FILE_PATH: Joi.string()
        .default('./logs/my-api-%DATE%.log'),

    LOG_FILE_ROTATE_FREQUENCY: Joi.string()
        .default('YYYY-MM-DD'),

    LOG_FILE_MAX_SIZE: Joi.string()
        .default('20m'),

    LOG_FILE_MAX_TIME: Joi.string()
        .default('14d'),

    ELASTICSEARCH_NODE_URL: Joi.string()
        .uri()
        .default('http://localhost:9200'),

    ELASTICSEARCH_USERNAME: Joi.string()
        .allow('')
        .optional(),

    ELASTICSEARCH_PASSWORD: Joi.string()
        .allow('')
        .optional(),

    ELASTICSEARCH_INDEX_PREFIX: Joi.string()
        .default('app-logs'),

    PII_MASKING_ENABLED: Joi.boolean()
        .truthy('true')
        .falsy('false')
        .default(true)
})