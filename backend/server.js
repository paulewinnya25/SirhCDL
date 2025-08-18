const path = require('path');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');

// Create Express app FIRST
const app = express();
const port = process.env.PORT || 5001;

// Configure PostgreSQL connection with correct credentials
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

// Middleware
app.use(cors());
app.use(express.json());

// Middleware pour s'assurer que toutes les réponses sont en UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Middleware pour servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Warning: Database connection failed:', err.message);
    console.log('Server will start without database connection');
    return;
  }
  console.log('Connected to PostgreSQL database');
  // Ensure UTF-8 client encoding
  client.query("SET client_encoding TO 'UTF8';")
    .then(() => console.log('PostgreSQL client encoding set to UTF8'))
    .catch((e) => console.error('Failed to set client encoding to UTF8', e))
    .finally(() => release());
});

// Also set client encoding once on the pool (for pooled queries)
pool.query("SET client_encoding TO 'UTF8';")
  .then(() => console.log('Pool client encoding set to UTF8'))
  .catch((e) => console.error('Failed to set pool client encoding to UTF8', e));

// Query to check existing tables
pool.query(`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
`, (err, result) => {
  if (err) {
    console.error('Warning: Could not retrieve tables:', err.message);
  } else {
    console.log('Tables existantes dans la base de données:');
    result.rows.forEach(row => {
      console.log(' - ' + row.table_name);
    });
  }
});

// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Routes pour l'onboarding et l'offboarding (AVANT les routes d'employés)
const onboardingRoutes = require('./routes/onboardingRoutes');
const offboardingRoutes = require('./routes/offboardingRoutes');
app.use('/api/employees', onboardingRoutes(pool));
app.use('/api/employees', offboardingRoutes(pool));

// Routes pour les employés (APRÈS les routes spécialisées)
const employeeRoutes = require('./routes/employeeRoutes');
app.use('/api/employees', employeeRoutes(pool));

// Ajoutez cette ligne avec les autres imports de routes
const sanctionRoutes = require('./routes/sanctionRoutes');

// Ajoutez cette ligne avec les autres définitions de routes
app.use('/api/sanctions', sanctionRoutes(pool));

// Importez la nouvelle route d'authentification
const employeeAuthRoutes = require('./routes/employeeAuthRoutes');

// Ajoutez cette ligne avec les autres définitions de routes
app.use('/api/employees/auth', employeeAuthRoutes(pool));

// Importez la route de réinitialisation de mot de passe
const passwordResetRoutes = require('./routes/passwordResetRoutes');

// Ajoutez cette ligne avec les autres définitions de routes
app.use('/api/password-reset', passwordResetRoutes);

// Routes pour les congés
const congeRoutes = require('./routes/congeRoutes');
app.use('/api/conges', congeRoutes(pool));

// Contract routes
const contratRoutes = require('./routes/contratRoutes');
app.use('/api/contrats', contratRoutes(pool));

// Ajoutez ceci avec les autres imports de routes
const visitesMedicalesRoutes = require('./routes/visitesMedicalesRoutes');

// Ajoutez ceci avec les autres définitions de routes
app.use('/api/visites-medicales', visitesMedicalesRoutes(pool));
// Routes pour les absences
const absenceRoutes = require('./routes/absenceRoutes');
app.use('/api/absences', absenceRoutes(pool));

// Ajouter cette ligne avec les autres imports de routes
const recrutementRoutes = require('./routes/recrutementRoutes');

// Ajouter cette ligne avec les autres définitions de routes
app.use('/api/recrutements', recrutementRoutes(pool));

// Importez la nouvelle route pour les départs
const departRoutes = require('./routes/departRoutes');

// Ajoutez cette ligne avec les autres définitions de routes
app.use('/api/departs', departRoutes(pool));

// Service notes routes
const noteRoutes = require('./routes/noteRoutes');
app.use('/api/notes', noteRoutes(pool));

const evenementRoutes = require('./routes/evenementRoutes');

// Ajouter cette ligne avec les autres définitions de routes
app.use('/api/evenements', evenementRoutes(pool));

// Ajouter cette ligne avec les autres imports de routes
const employeeRequestRoutes = require('./routes/employeeRequestRoutes');

// Ajouter cette ligne avec les autres définitions de routes
app.use('/api/requests', employeeRequestRoutes(pool));

// Error handling middleware pour les fichiers trop volumineux
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Le fichier est trop volumineux' });
    }
  }
  next(err);
});

// General error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});