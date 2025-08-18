const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configuration de la base de données
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rh_portal',
  password: '123456',
  port: 5432,
});

// Configuration email (à adapter selon votre serveur SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail', // ou votre service SMTP
  auth: {
    user: 'votre-email@gmail.com', // À configurer
    pass: 'votre-mot-de-passe-app' // À configurer
  }
});

// Route pour demander une réinitialisation de mot de passe
router.post('/request-reset', async (req, res) => {
  try {
    const { matricule } = req.body;
    
    if (!matricule) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le matricule est requis' 
      });
    }

    // Vérifier si l'employé existe
    const employeeQuery = 'SELECT * FROM employees WHERE matricule = $1';
    const employeeResult = await pool.query(employeeQuery, [matricule]);
    
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employé non trouvé avec ce matricule' 
      });
    }

    const employee = employeeResult.rows[0];
    
    if (!employee.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucun email associé à ce matricule' 
      });
    }

    // Générer un token unique
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 heure

    // Sauvegarder le token dans la base de données
    const tokenQuery = `
      INSERT INTO password_reset_tokens (matricule, token, expires_at, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (matricule) 
      DO UPDATE SET token = $2, expires_at = $3, created_at = NOW()
    `;
    
    await pool.query(tokenQuery, [matricule, resetToken, resetTokenExpiry]);

    // Envoyer l'email de réinitialisation
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: 'noreply@centre-diagnostic.com',
      to: employee.email,
      subject: 'Réinitialisation de votre mot de passe - Portail RH',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Réinitialisation de mot de passe</h2>
          <p>Bonjour ${employee.nom_prenom},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe pour le portail RH.</p>
          <p>Votre matricule : <strong>${employee.matricule}</strong></p>
          <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #3498db; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p><strong>Attention :</strong> Ce lien expire dans 1 heure.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
          <p style="color: #7f8c8d; font-size: 12px;">
            Centre de Diagnostic - Portail RH<br>
            Ceci est un email automatique, merci de ne pas y répondre.
          </p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      
      res.json({
        success: true,
        message: 'Email de réinitialisation envoyé avec succès',
        email: employee.email
      });
      
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);
      
      // Si l'email échoue, on peut quand même créer le token
      res.json({
        success: true,
        message: 'Token de réinitialisation créé (email non envoyé)',
        token: resetToken, // Pour les tests
        email: employee.email
      });
    }

  } catch (error) {
    console.error('Erreur réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route pour réinitialiser le mot de passe avec le token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token et nouveau mot de passe requis'
      });
    }

    // Vérifier le token
    const tokenQuery = `
      SELECT * FROM password_reset_tokens 
      WHERE token = $1 AND expires_at > NOW() 
      ORDER BY created_at DESC LIMIT 1
    `;
    
    const tokenResult = await pool.query(tokenQuery, [token]);
    
    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    const resetToken = tokenResult.rows[0];
    
    // Mettre à jour le mot de passe
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const updateQuery = 'UPDATE employees SET password = $1 WHERE matricule = $2';
    await pool.query(updateQuery, [hashedPassword, resetToken.matricule]);
    
    // Supprimer le token utilisé
    const deleteTokenQuery = 'DELETE FROM password_reset_tokens WHERE token = $1';
    await pool.query(deleteTokenQuery, [token]);
    
    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur mise à jour mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route pour vérifier la validité d'un token
router.get('/verify-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const tokenQuery = `
      SELECT * FROM password_reset_tokens 
      WHERE token = $1 AND expires_at > NOW()
    `;
    
    const tokenResult = await pool.query(tokenQuery, [token]);
    
    if (tokenResult.rows.length === 0) {
      return res.json({
        valid: false,
        message: 'Token invalide ou expiré'
      });
    }
    
    res.json({
      valid: true,
      matricule: tokenResult.rows[0].matricule,
      expiresAt: tokenResult.rows[0].expires_at
    });

  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(500).json({
      valid: false,
      message: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;

