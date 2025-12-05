const path = require('path');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const http = require('http');
const WebSocketServer = require('./websocketServer');

// Create Express app FIRST
const app = express();
const port = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

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

// Middleware optimisé pour éviter les timeouts
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Augmenter les limites pour éviter les timeouts
app.use(express.json({ 
  limit: '50mb',
  timeout: 300000 // 5 minutes
}));

app.use(express.urlencoded({ 
  limit: '50mb', 
  extended: true,
  timeout: 300000
}));

// Middleware de monitoring des performances
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`⏱️ ${req.method} ${req.path} - ${duration}ms`);
    
    if (duration > 30000) { // Plus de 30 secondes
      console.warn(`⚠️ REQUÊTE LENTE: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
});

// Middleware spécifique pour l'onboarding
app.use('/api/employees/onboarding', (req, res, next) => {
  console.log('📥 Onboarding request received');
  console.log('📊 Content-Length:', req.headers['content-length']);
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  // Timeouts pour éviter les blocages
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  
  next();
});

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

// Endpoint de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

// Endpoint ping
app.get('/api/ping', (req, res) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Routes pour l'onboarding et l'offboarding (AVANT les routes d'employés)
const onboardingRoutes = require('./routes/onboardingRoutes');
const offboardingRoutes = require('./routes/offboardingRoutes');
app.use('/api/employees', onboardingRoutes(pool));
app.use('/api/employees', offboardingRoutes(pool));

// Routes pour les procédures médicales
const procedureRoutes = require('./routes/procedureRoutes');
app.use('/api/procedures', procedureRoutes);

// Routes pour les employés (APRÈS les routes spécialisées)
const employeeRoutes = require('./routes/employeeRoutes');
app.use('/api/employees', employeeRoutes(pool));

// Ajoutez cette ligne avec les autres imports de routes
const sanctionRoutes = require('./routes/sanctionRoutes');

// Ajoutez cette ligne avec les autres définitions de routes
app.use('/api/sanctions', sanctionRoutes(pool));



// Importez la nouvelle route d'authentification
const employeeAuthRoutes = require('./routes/employeeAuthRoutes');
// Routes de messagerie réelle
const realMessagingRoutes = require('./routes/realMessagingRoutes');
const photoRoutes = require('./routes/photoRoutes');
app.use('/api/messages', realMessagingRoutes(pool));
app.use('/api/photos', photoRoutes(pool));

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

// Routes pour les contrats PDF
const contratPDFRoutes = require('./routes/contratPDFRoutes');
app.use('/api/contrats-pdf', contratPDFRoutes);

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

// Routes pour les entretiens
const interviewRoutes = require('./routes/interviewRoutes');
app.use('/api/interviews', interviewRoutes);

// Routes pour les tâches
const taskRoutes = require('./routes/taskRoutes');
app.use('/api/tasks', taskRoutes);

// Routes pour les notifications en temps réel
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes(pool));

// Routes pour les notifications des employés (existantes)
const employeeNotificationRoutes = require('./routes/employeeNotificationRoutes');
app.use('/api/employee-notifications', employeeNotificationRoutes(pool));

// Error handling middleware pour les fichiers trop volumineux

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

// Start server with WebSocket
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📡 WebSocket server ready for real-time notifications`);
});

// Initialize WebSocket server
const wsServer = new WebSocketServer(server);

// Make WebSocket server available globally for API routes
global.wsServer = wsServer;