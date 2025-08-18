const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rh_portal', 
  password: 'Cdl202407', 
  port: 5432,
  // Configuration pour l'encodage UTF-8
  options: '-c client_encoding=UTF8',
  // Paramètres supplémentaires pour l'encodage
  charset: 'utf8',
  // Connection timeout
  connectionTimeoutMillis: 10000,
  // Idle timeout
  idleTimeoutMillis: 30000,
  // Max connections
  max: 20
});

module.exports = pool;