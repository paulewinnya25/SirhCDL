const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');

module.exports = (pool) => {
  // Login route
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check if user exists
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const user = userResult.rows[0];
      
      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Create JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Return user data and token
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      });
    } catch (err) {
      console.error('Error during login:', err.stack);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // Register route
  router.post('/register', async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, role = 'user' } = req.body;
      
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create new user
      const result = await pool.query(
        `INSERT INTO users (username, email, password, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, username, email, first_name, last_name, role`,
        [username, email, hashedPassword, firstName, lastName, role]
      );
      
      const newUser = result.rows[0];
      
      // Create JWT token
      const token = jwt.sign(
        { 
          id: newUser.id, 
          email: newUser.email, 
          role: newUser.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Return user data and token
      res.status(201).json({
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: newUser.role
        }
      });
    } catch (err) {
      console.error('Error during registration:', err.stack);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // Get current user route
  router.get('/me', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      
      const result = await pool.query(
        'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const user = result.rows[0];
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      });
    } catch (err) {
      console.error('Error getting current user:', err.stack);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  return router;
};