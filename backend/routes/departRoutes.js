const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // Récupérer tous les départs
    router.get('/', async (req, res) => {
        try {
            const query = `
                SELECT * FROM historique_departs 
                ORDER BY date_depart DESC
            `;
            const result = await pool.query(query);
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching departures:', err);
            res.status(500).json({ error: 'Failed to fetch departures', details: err.message });
        }
    });

    // Rechercher des départs avec filtres
    router.get('/search/filter', async (req, res) => {
        try {
            const { search, departement, statut, motif_depart, dateDebut, dateFin } = req.query;
            
            let conditions = [];
            let values = [];
            let paramIndex = 1;
            
            if (search) {
                conditions.push(`(nom ILIKE $${paramIndex} OR prenom ILIKE $${paramIndex} OR poste ILIKE $${paramIndex})`);
                values.push(`%${search}%`);
                paramIndex++;
            }
            
            if (departement) {
                conditions.push(`departement = $${paramIndex}`);
                values.push(departement);
                paramIndex++;
            }
            
            if (statut) {
                conditions.push(`statut = $${paramIndex}`);
                values.push(statut);
                paramIndex++;
            }
            
            if (motif_depart) {
                conditions.push(`motif_depart = $${paramIndex}`);
                values.push(motif_depart);
                paramIndex++;
            }
            
            if (dateDebut) {
                conditions.push(`date_depart >= $${paramIndex}`);
                values.push(dateDebut);
                paramIndex++;
            }
            
            if (dateFin) {
                conditions.push(`date_depart <= $${paramIndex}`);
                values.push(dateFin);
                paramIndex++;
            }
            
            let query = 'SELECT * FROM historique_departs';
            
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            
            query += ' ORDER BY date_depart DESC';
            
            const result = await pool.query(query, values);
            res.json(result.rows);
        } catch (err) {
            console.error('Error searching departures:', err);
            res.status(500).json({ error: 'Failed to search departures', details: err.message });
        }
    });

    // Récupérer un départ par ID
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const query = 'SELECT * FROM historique_departs WHERE id = $1';
            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Departure not found' });
            }

            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error fetching departure:', err);
            res.status(500).json({ error: 'Failed to fetch departure', details: err.message });
        }
    });

    // Créer un nouveau départ
    router.post('/', async (req, res) => {
        try {
            const { 
                nom, 
                prenom, 
                departement, 
                statut, 
                poste, 
                date_depart, 
                motif_depart, 
                commentaire 
            } = req.body;

            const query = `
                INSERT INTO historique_departs 
                (nom, prenom, departement, statut, poste, date_depart, motif_depart, commentaire) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                RETURNING *
            `;

            const values = [
                nom, 
                prenom, 
                departement, 
                statut, 
                poste, 
                date_depart, 
                motif_depart, 
                commentaire
            ];

            const result = await pool.query(query, values);
            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error('Error creating departure:', err);
            res.status(500).json({ error: 'Failed to create departure', details: err.message });
        }
    });

    // Mettre à jour un départ
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                nom, 
                prenom, 
                departement, 
                statut, 
                poste, 
                date_depart, 
                motif_depart, 
                commentaire 
            } = req.body;

            const query = `
                UPDATE historique_departs 
                SET nom = $1, 
                    prenom = $2, 
                    departement = $3, 
                    statut = $4, 
                    poste = $5, 
                    date_depart = $6, 
                    motif_depart = $7, 
                    commentaire = $8,
                    date_modification = CURRENT_TIMESTAMP
                WHERE id = $9 
                RETURNING *
            `;

            const values = [
                nom, 
                prenom, 
                departement, 
                statut, 
                poste, 
                date_depart, 
                motif_depart, 
                commentaire,
                id
            ];

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Departure not found' });
            }

            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error updating departure:', err);
            res.status(500).json({ error: 'Failed to update departure', details: err.message });
        }
    });

    // Supprimer un départ
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const query = 'DELETE FROM historique_departs WHERE id = $1 RETURNING *';
            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Departure not found' });
            }

            res.json({ message: 'Departure deleted successfully', departure: result.rows[0] });
        } catch (err) {
            console.error('Error deleting departure:', err);
            res.status(500).json({ error: 'Failed to delete departure', details: err.message });
        }
    });

    // Récupérer les statistiques sur les départs
    router.get('/stats/overview', async (req, res) => {
        try {
            // Nombre total de départs
            const totalQuery = 'SELECT COUNT(*) as total FROM historique_departs';
            const totalResult = await pool.query(totalQuery);
            
            // Départs par motif
            const motifQuery = 'SELECT motif_depart, COUNT(*) as count FROM historique_departs GROUP BY motif_depart ORDER BY count DESC';
            const motifResult = await pool.query(motifQuery);
            
            // Départs par département
            const deptQuery = 'SELECT departement, COUNT(*) as count FROM historique_departs WHERE departement != \'\' GROUP BY departement ORDER BY count DESC';
            const deptResult = await pool.query(deptQuery);
            
            // Départs par mois (sur les 12 derniers mois)
            const monthQuery = `
                SELECT 
                    TO_CHAR(date_depart, 'YYYY-MM') as month, 
                    COUNT(*) as count 
                FROM historique_departs 
                WHERE date_depart >= NOW() - INTERVAL '12 months' 
                GROUP BY TO_CHAR(date_depart, 'YYYY-MM') 
                ORDER BY month ASC
            `;
            const monthResult = await pool.query(monthQuery);
            
            res.json({
                total: totalResult.rows[0].total,
                byMotif: motifResult.rows,
                byDepartment: deptResult.rows,
                byMonth: monthResult.rows
            });
        } catch (err) {
            console.error('Error fetching departure statistics:', err);
            res.status(500).json({ error: 'Failed to fetch departure statistics', details: err.message });
        }
    });

    return router;
};