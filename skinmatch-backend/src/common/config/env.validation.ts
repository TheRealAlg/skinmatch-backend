import * as Joi from "joi";

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default("1h"),
  AUTH_PROVIDER: Joi.string().valid("mock", "firebase").default("mock"),
  ALLOW_MOCK_AUTH: Joi.boolean().default(false),
  DEFAULT_MARKET_CODE: Joi.string().default("TR"),
  DEFAULT_LOCALE: Joi.string().default("tr-TR"),
  REDIS_URL: Joi.string().optional(),
  MEILISEARCH_HOST: Joi.string().optional(),
  MEILISEARCH_API_KEY: Joi.string().optional()
});
