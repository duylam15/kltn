import * as dotenv from 'dotenv';
dotenv.config();

export const buildDbUrl = () => {
  // Ưu tiên dùng trực tiếp DATABASE_URL
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const {
    DB_HOST = 'localhost',
    DB_PORT = '5432',
    DB_NAME = 'postgres',
    DB_USER = 'postgres',
    DB_PASSWORD = 'postgres'
  } = process.env;
  return `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  dbUrl: buildDbUrl(),
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  }
};

if (!env.dbUrl) {
  throw new Error('DATABASE_URL is required');
}

export default env;