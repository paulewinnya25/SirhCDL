const express = require('express');

// Exportez une fonction qui prend l'objet pool comme argument
module.exports = (pool) => {
    const router = express.Router();

    // Récupérer tous les congés
    router.get('/', async (req, res) => {
        try {
            const query = `
                SELECT * FROM conges
                ORDER BY date_demande DESC
            `;
            const result = await pool.query(query);
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching conges:', err);
            res.status(500).json({ error: 'Failed to fetch conges', details: err.message });
        }
    });

    // Créer un nouveau congé
    router.post('/', async (req, res) => {
        try {
            const { 
                nom_employe, 
                service, 
                poste, 
                date_embauche,
                jours_conges_annuels,
                date_demande,
                date_debut, 
                date_fin, 
                motif,
                date_retour,
                jours_pris,
                jours_restants,
                date_prochaine_attribution,
                type_conge,
                document_path
            } = req.body;

            const query = `
                INSERT INTO conges 
                (nom_employe, service, poste, date_embauche, jours_conges_annuels,
                date_demande, date_debut, date_fin, motif, date_retour, jours_pris,
                jours_restants, date_prochaine_attribution, type_conge, statut, document_path) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
                RETURNING *
            `;

            const values = [
                nom_employe, 
                service || null, 
                poste || null,
                date_embauche || null,
                jours_conges_annuels || null,
                date_demande || new Date(),
                date_debut, 
                date_fin,
                motif || null,
                date_retour || null,
                jours_pris || null,
                jours_restants || null,
                date_prochaine_attribution || null,
                type_conge || 'Congé payé',
                'En attente', // Statut par défaut
                document_path || null
            ];

            const result = await pool.query(query, values);
            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error('Error creating conge:', err);
            res.status(500).json({ error: 'Failed to create conge', details: err.message });
        }
    });

    // Récupérer un congé par ID
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const query = 'SELECT * FROM conges WHERE id = $1';
            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Conge not found' });
            }

            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error fetching conge:', err);
            res.status(500).json({ error: 'Failed to fetch conge', details: err.message });
        }
    });

    // Récupérer les congés par nom d'employé
    router.get('/employee/:name', async (req, res) => {
        try {
            const { name } = req.params;
            const query = 'SELECT * FROM conges WHERE nom_employe ILIKE $1 ORDER BY date_demande DESC';
            const result = await pool.query(query, [`%${name}%`]);
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching employee conges:', err);
            res.status(500).json({ error: 'Failed to fetch employee conges', details: err.message });
        }
    });

    // Mettre à jour un congé
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                nom_employe, 
                service, 
                poste, 
                date_embauche,
                jours_conges_annuels,
                date_demande,
                date_debut, 
                date_fin, 
                motif,
                date_retour,
                jours_pris,
                jours_restants,
                date_prochaine_attribution,
                type_conge,
                statut,
                document_path
            } = req.body;

            const query = `
                UPDATE conges 
                SET nom_employe = $1, 
                    service = $2, 
                    poste = $3, 
                    date_embauche = $4,
                    jours_conges_annuels = $5,
                    date_demande = $6,
                    date_debut = $7, 
                    date_fin = $8, 
                    motif = $9,
                    date_retour = $10,
                    jours_pris = $11,
                    jours_restants = $12,
                    date_prochaine_attribution = $13,
                    type_conge = $14,
                    statut = $15,
                    document_path = $16
                WHERE id = $17 
                RETURNING *
            `;

            const values = [
                nom_employe, 
                service || null, 
                poste || null,
                date_embauche || null,
                jours_conges_annuels || null,
                date_demande || new Date(),
                date_debut, 
                date_fin,
                motif || null,
                date_retour || null,
                jours_pris || null,
                jours_restants || null,
                date_prochaine_attribution || null,
                type_conge || 'Congé payé',
                statut || 'En attente',
                document_path || null,
                id
            ];

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Conge not found' });
            }

            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error updating conge:', err);
            res.status(500).json({ error: 'Failed to update conge', details: err.message });
        }
    });

    // Approuver un congé
    router.put('/:id/approve', async (req, res) => {
        try {
            const { id } = req.params;
            
            const query = `
                UPDATE conges 
                SET statut = 'Approuvé',
                    date_traitement = CURRENT_TIMESTAMP
                WHERE id = $1 
                RETURNING *
            `;
            
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Conge not found' });
            }
            
            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error approving conge:', err);
            res.status(500).json({ error: 'Failed to approve conge', details: err.message });
        }
    });

    // Refuser un congé
    router.put('/:id/reject', async (req, res) => {
        try {
            const { id } = req.params;
            const { motif_refus } = req.body;
            
            const query = `
                UPDATE conges 
                SET statut = 'Refusé',
                    date_traitement = CURRENT_TIMESTAMP,
                    motif = CASE WHEN $1 IS NOT NULL THEN 
                                CASE WHEN motif IS NULL OR motif = '' 
                                    THEN $1 
                                    ELSE motif || ' | Motif de refus: ' || $1 
                                END
                            ELSE motif END
                WHERE id = $2 
                RETURNING *
            `;
            
            const result = await pool.query(query, [motif_refus || null, id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Conge not found' });
            }
            
            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error rejecting conge:', err);
            res.status(500).json({ error: 'Failed to reject conge', details: err.message });
        }
    });

    // Supprimer un congé
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const query = 'DELETE FROM conges WHERE id = $1 RETURNING *';
            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Conge not found' });
            }

            res.json({ message: 'Conge deleted successfully', conge: result.rows[0] });
        } catch (err) {
            console.error('Error deleting conge:', err);
            res.status(500).json({ error: 'Failed to delete conge', details: err.message });
        }
    });

    // Récupérer les congés par statut
    router.get('/status/:status', async (req, res) => {
        try {
            const { status } = req.params;
            const query = 'SELECT * FROM conges WHERE statut = $1 ORDER BY date_demande DESC';
            const result = await pool.query(query, [status]);
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching conges by status:', err);
            res.status(500).json({ error: 'Failed to fetch conges by status', details: err.message });
        }
    });

    // Recherche avancée des congés
    router.get('/search/filter', async (req, res) => {
        try {
            const { 
                employee, 
                service, 
                type, 
                status, 
                startDateFrom, 
                startDateTo 
            } = req.query;
            
            let conditions = [];
            let values = [];
            let paramIndex = 1;
            
            if (employee) {
                conditions.push(`nom_employe ILIKE $${paramIndex}`);
                values.push(`%${employee}%`);
                paramIndex++;
            }
            
            if (service) {
                conditions.push(`service = $${paramIndex}`);
                values.push(service);
                paramIndex++;
            }
            
            if (type) {
                conditions.push(`type_conge = $${paramIndex}`);
                values.push(type);
                paramIndex++;
            }
            
            if (status) {
                conditions.push(`statut = $${paramIndex}`);
                values.push(status);
                paramIndex++;
            }
            
            if (startDateFrom) {
                conditions.push(`date_debut >= $${paramIndex}`);
                values.push(startDateFrom);
                paramIndex++;
            }
            
            if (startDateTo) {
                conditions.push(`date_debut <= $${paramIndex}`);
                values.push(startDateTo);
                paramIndex++;
            }
            
            let query = 'SELECT * FROM conges';
            
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            
            query += ' ORDER BY date_demande DESC';
            
            const result = await pool.query(query, values);
            res.json(result.rows);
        } catch (err) {
            console.error('Error searching conges:', err);
            res.status(500).json({ error: 'Failed to search conges', details: err.message });
        }
    });

    return router;
};