const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const onboardingRoutes = (pool) => {
  const router = express.Router();

  // Configuration de Multer pour l'upload des documents
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads/onboarding');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ 
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
      files: 10 // Max 10 fichiers
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Type de fichier non autorisé. Types acceptés: PDF, JPG, PNG, DOC, DOCX'), false);
      }
    }
  });

  // Route pour créer un nouvel employé (onboarding)
  router.post('/onboarding', upload.array('documents'), async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const employeeData = JSON.parse(req.body.employeeData);
      const documents = req.files || [];
      
      // Vérifier si le matricule existe déjà
      const existingEmployee = await client.query(
        'SELECT id FROM employees WHERE matricule = $1',
        [employeeData.matricule]
      );
      
      if (existingEmployee.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: 'Un employé avec ce matricule existe déjà' 
        });
      }

      // Insérer l'employé dans la table employees
      const employeeResult = await client.query(`
        INSERT INTO employees (
          matricule, 
          nom_prenom, 
          email, 
          telephone, 
          genre, 
          lieu_naissance, 
          situation_maritale, 
          nbr_enfants, 
          cnss_number, 
          cnamgs_number,
          poste_actuel, 
          type_contrat, 
          date_entree, 
          date_fin_contrat, 
          categorie, 
          responsable, 
          niveau_etude, 
          specialisation,
          entity, 
          departement, 
          domaine_fonctionnel,
          statut,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) 
        RETURNING *
      `, [
        employeeData.matricule,
        employeeData.nom_prenom,
        employeeData.email,
        employeeData.telephone,
        employeeData.genre,
        employeeData.lieu_naissance,
        employeeData.situation_maritale,
        employeeData.nbr_enfants,
        employeeData.cnss_number,
        employeeData.cnamgs_number,
        employeeData.poste_actuel,
        employeeData.type_contrat,
        employeeData.date_entree,
        employeeData.date_fin_contrat,
        employeeData.categorie,
        employeeData.responsable,
        employeeData.niveau_etude,
        employeeData.specialisation,
        employeeData.entity,
        employeeData.departement,
        employeeData.domaine_fonctionnel,
        'Actif',
        new Date()
      ]);

      const newEmployee = employeeResult.rows[0];

      // Enregistrer l'historique d'onboarding
      const onboardingResult = await client.query(`
        INSERT INTO onboarding_history (
          employee_id, 
          date_integration, 
          checklist, 
          documents, 
          notes,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *
      `, [
        newEmployee.id,
        employeeData.date_entree,
        JSON.stringify(employeeData.checklist || {}),
        documents.map(doc => doc.filename),
        employeeData.notes || '',
        new Date()
      ]);

      // Enregistrer dans l'historique de recrutement
      await client.query(`
        INSERT INTO recrutement_history (
          employee_id, 
          date_recrutement, 
          poste_recrute, 
          type_contrat,
          salaire_propose,
          source_recrutement,
          notes,
          statut,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        newEmployee.id,
        employeeData.date_entree,
        employeeData.poste_actuel,
        employeeData.type_contrat,
        employeeData.salaire_propose || null,
        employeeData.source_recrutement || 'Onboarding direct',
        employeeData.notes || 'Recrutement via processus d\'onboarding',
        'Recruté',
        new Date()
      ]);

      // Enregistrer les informations de contrat
      if (employeeData.type_contrat && employeeData.date_entree) {
        await client.query(`
          INSERT INTO contrats (
            employee_id, 
            type_contrat, 
            date_debut, 
            date_fin, 
            statut,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          newEmployee.id,
          employeeData.type_contrat,
          employeeData.date_entree,
          employeeData.date_fin_contrat || null,
          'Actif',
          new Date()
        ]);
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Onboarding terminé avec succès',
        employee: newEmployee,
        onboarding: onboardingResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erreur lors de l\'onboarding:', error);
      
      // Supprimer les fichiers uploadés en cas d'erreur
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'onboarding: ' + error.message
      });
    } finally {
      client.release();
    }
  });

  // Route pour récupérer l'historique d'onboarding d'un employé
  router.get('/onboarding/:employeeId', async (req, res) => {
    try {
      const { employeeId } = req.params;
      
      const result = await pool.query(`
        SELECT oh.*, e.nom_prenom, e.matricule
        FROM onboarding_history oh
        JOIN employees e ON oh.employee_id = e.id
        WHERE oh.employee_id = $1
        ORDER BY oh.created_at DESC
      `, [employeeId]);
      
      res.json({
        success: true,
        onboarding: result.rows
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'onboarding:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération: ' + error.message
      });
    }
  });

  // Route pour récupérer tous les onboarding récents
  router.get('/onboarding', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT oh.*, e.nom_prenom, e.matricule, e.poste_actuel
        FROM onboarding_history oh
        JOIN employees e ON oh.employee_id = e.id
        ORDER BY oh.created_at DESC
        LIMIT 50
      `);
      
      res.json({
        success: true,
        onboarding: result.rows
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des onboarding:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération: ' + error.message
      });
    }
  });

  // Route pour télécharger un document d'onboarding
  router.get('/onboarding/document/:filename', (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '../uploads/onboarding', filename);
      
      if (fs.existsSync(filePath)) {
        res.download(filePath);
      } else {
        res.status(404).json({
          success: false,
          message: 'Document non trouvé'
        });
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du téléchargement: ' + error.message
      });
    }
  });

  // Route pour supprimer un document d'onboarding
  router.delete('/onboarding/document/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '../uploads/onboarding', filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        
        // Mettre à jour la base de données pour retirer le document
        await pool.query(`
          UPDATE onboarding_history 
          SET documents = array_remove(documents, $1)
          WHERE $1 = ANY(documents)
        `, [filename]);
        
        res.json({
          success: true,
          message: 'Document supprimé avec succès'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Document non trouvé'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression: ' + error.message
      });
    }
  });

  return router;
};

module.exports = onboardingRoutes;
