import mysql from 'mysql2/promise';

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export function createPool(config: DbConfig): mysql.Pool {
  return mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
}

export async function closePool(pool: mysql.Pool): Promise<void> {
  await pool.end();
}

declare module 'fastify' {
  interface FastifyInstance {
    db: mysql.Pool;
  }
}

