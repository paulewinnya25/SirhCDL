const express = require('express');
const bcrypt = require('bcryptjs'); // Pour comparer les mots de passe hachés

module.exports = (pool) => {
  const router = express.Router();

  // Route d'authentification des employés
  router.post('/login', async (req, res) => {
    try {
      const { matricule, password } = req.body;

      // Validation des données
      if (!matricule || !password) {
        return res.status(400).json({
          success: false,
          message: 'Matricule et mot de passe sont requis'
        });
      }

      console.log('🔐 Tentative de connexion pour le matricule:', matricule);

      // Authentification avec la vraie base de données
      // Rechercher l'employé UNIQUEMENT par matricule
      const getEmployeeQuery = `
        SELECT * FROM employees 
        WHERE matricule = $1 AND matricule != ''
      `;
      
      const employeeResult = await pool.query(getEmployeeQuery, [matricule]);
      
      if (employeeResult.rows.length === 0) {
        console.log('❌ Employé non trouvé avec le matricule:', matricule);
        return res.status(401).json({ 
          success: false, 
          message: 'Matricule ou mot de passe incorrect' 
        });
      }

      const employee = employeeResult.rows[0];
      console.log('👤 Employé trouvé:', employee.nom_prenom, 'avec le matricule:', matricule);

      // Vérifier le mot de passe avec support pour migration progressive
      // Supporte à la fois les mots de passe en clair (legacy) et hashés (nouveau)
      let isPasswordValid = false;
      
      // Vérifier si le mot de passe est hashé (commence par $2a$, $2b$, ou $2y$)
      if (employee.password && employee.password.startsWith('$2')) {
        // Mot de passe hashé avec bcrypt
        isPasswordValid = await bcrypt.compare(password, employee.password);
      } else {
        // Mot de passe en clair (legacy) - migration progressive
        isPasswordValid = employee.password === password;
        
        // Si la connexion réussit avec un mot de passe en clair, le hasher automatiquement
        if (isPasswordValid) {
          try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            await pool.query(
              'UPDATE employees SET password = $1 WHERE id = $2',
              [hashedPassword, employee.id]
            );
            console.log('✅ Mot de passe migré vers bcrypt pour le matricule:', matricule);
          } catch (hashError) {
            console.error('⚠️ Erreur lors de la migration du mot de passe:', hashError);
            // Continuer quand même la connexion
          }
        }
      }

      if (!isPasswordValid) {
        console.log('❌ Mot de passe incorrect pour le matricule:', matricule);
        return res.status(401).json({ 
          success: false, 
          message: 'Matricule ou mot de passe incorrect' 
        });
      }

      console.log('✅ Authentification réussie pour le matricule:', matricule);

      // Ne jamais renvoyer le mot de passe au client
      const { password: _, ...employeeData } = employee;

      // Renvoyer les informations de l'employé
      res.json({ 
        success: true, 
        employee: employeeData
      });

    } catch (err) {
      console.error('💥 Erreur lors de l\'authentification:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Une erreur est survenue pendant l\'authentification', 
        details: err.message 
      });
    }
  });

  // Route pour changer le mot de passe
  router.put('/change-password', async (req, res) => {
    try {
      const { employeeId, currentPassword, newPassword } = req.body;

      // Validation des données
      if (!employeeId || !currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs sont requis'
        });
      }

      // Vérifier que le nouveau mot de passe respecte les critères de sécurité
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
        });
      }

      // Récupérer l'employé et vérifier l'ancien mot de passe
      const getEmployeeQuery = `
        SELECT * FROM employees 
        WHERE id = $1
      `;
      const employeeResult = await pool.query(getEmployeeQuery, [employeeId]);

      if (employeeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Employé non trouvé'
        });
      }

      const employee = employeeResult.rows[0];

      // Vérifier l'ancien mot de passe avec support pour migration progressive
      let currentPasswordMatch = false;
      
      // Vérifier si le mot de passe est hashé
      if (employee.password && employee.password.startsWith('$2')) {
        // Mot de passe hashé avec bcrypt
        currentPasswordMatch = await bcrypt.compare(currentPassword, employee.password);
      } else {
        // Mot de passe en clair (legacy)
        currentPasswordMatch = currentPassword === employee.password;
      }

      if (!currentPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: 'L\'ancien mot de passe est incorrect'
        });
      }

      // Hasher le nouveau mot de passe
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Mettre à jour le mot de passe dans la base de données
      const updatePasswordQuery = `
        UPDATE employees 
        SET password = $1 
        WHERE id = $2
      `;
      await pool.query(updatePasswordQuery, [hashedNewPassword, employeeId]);

      res.json({
        success: true,
        message: 'Mot de passe modifié avec succès'
      });

    } catch (err) {
      console.error('Error changing password:', err);
      res.status(500).json({
        success: false,
        message: 'Une erreur est survenue lors du changement de mot de passe',
        details: err.message
      });
    }
  });

  return router;
};