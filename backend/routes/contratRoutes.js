const express = require('express');

// Exportez une fonction qui prend l'objet pool comme argument
module.exports = (pool) => {
    const router = express.Router();

    // Récupérer tous les contrats
    router.get('/', async (req, res) => {
        try {
            const query = `
                SELECT * FROM contrats ORDER BY id DESC
            `;
            const result = await pool.query(query);
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching contrats:', err);
            res.status(500).json({ error: 'Failed to fetch contrats', details: err.message });
        }
    });

    // Créer un nouveau contrat
    router.post('/', async (req, res) => {
        try {
            const { 
                nom_employe, 
                type_contrat, 
                date_debut, 
                date_fin, 
                poste, 
                service,
                contrat_content
            } = req.body;

            const query = `
                INSERT INTO contrats 
                (nom_employe, type_contrat, date_debut, date_fin, poste, service, contrat_content) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                RETURNING *
            `;

            const values = [
                nom_employe, 
                type_contrat, 
                date_debut, 
                date_fin, 
                poste || '', 
                service || '',
                contrat_content
            ];

            const result = await pool.query(query, values);
            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error('Error creating contrat:', err);
            res.status(500).json({ error: 'Failed to create contrat', details: err.message });
        }
    });

    // Récupérer un contrat par ID
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const query = 'SELECT * FROM contrats WHERE id = $1';
            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Contrat not found' });
            }

            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error fetching contrat:', err);
            res.status(500).json({ error: 'Failed to fetch contrat', details: err.message });
        }
    });

    // Récupérer un contrat par nom d'employé
    router.get('/employe/:nom', async (req, res) => {
        try {
            const { nom } = req.params;
            const query = 'SELECT * FROM contrats WHERE nom_employe ILIKE $1';
            const result = await pool.query(query, [`%${nom}%`]);
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching contrat by employee name:', err);
            res.status(500).json({ error: 'Failed to fetch contrat', details: err.message });
        }
    });

    // Mettre à jour un contrat
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                nom_employe, 
                type_contrat, 
                date_debut, 
                date_fin, 
                poste, 
                service,
                contrat_content
            } = req.body;

            const query = `
                UPDATE contrats 
                SET nom_employe = $1, 
                    type_contrat = $2, 
                    date_debut = $3, 
                    date_fin = $4, 
                    poste = $5, 
                    service = $6,
                    contrat_content = $7,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $8 
                RETURNING *
            `;

            const values = [
                nom_employe, 
                type_contrat, 
                date_debut, 
                date_fin, 
                poste || '', 
                service || '',
                contrat_content,
                id
            ];

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Contrat not found' });
            }

            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error updating contrat:', err);
            res.status(500).json({ error: 'Failed to update contrat', details: err.message });
        }
    });

    // Supprimer un contrat
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const query = 'DELETE FROM contrats WHERE id = $1 RETURNING *';
            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Contrat not found' });
            }

            res.json({ message: 'Contrat deleted successfully', contrat: result.rows[0] });
        } catch (err) {
            console.error('Error deleting contrat:', err);
            res.status(500).json({ error: 'Failed to delete contrat', details: err.message });
        }
    });

    // Rechercher des contrats (avec filtres)
    router.get('/search/filter', async (req, res) => {
        try {
            const { nom, type, service, dateDebut, dateFin } = req.query;
            
            let conditions = [];
            let values = [];
            let paramIndex = 1;
            
            if (nom) {
                conditions.push(`nom_employe ILIKE $${paramIndex}`);
                values.push(`%${nom}%`);
                paramIndex++;
            }
            
            if (type) {
                conditions.push(`type_contrat = $${paramIndex}`);
                values.push(type);
                paramIndex++;
            }
            
            if (service) {
                conditions.push(`service ILIKE $${paramIndex}`);
                values.push(`%${service}%`);
                paramIndex++;
            }
            
            if (dateDebut) {
                conditions.push(`date_debut >= $${paramIndex}`);
                values.push(dateDebut);
                paramIndex++;
            }
            
            if (dateFin) {
                conditions.push(`date_fin <= $${paramIndex}`);
                values.push(dateFin);
                paramIndex++;
            }
            
            let query = 'SELECT * FROM contrats';
            
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            
            query += ' ORDER BY id DESC';
            
            const result = await pool.query(query, values);
            res.json(result.rows);
        } catch (err) {
            console.error('Error searching contrats:', err);
            res.status(500).json({ error: 'Failed to search contrats', details: err.message });
        }
    });

    return router;
};