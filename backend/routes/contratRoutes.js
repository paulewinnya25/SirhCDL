const express = require('express');

// Exportez une fonction qui prend l'objet pool comme argument
module.exports = (pool) => {
    const router = express.Router();

    // Récupérer tous les contrats
    router.get('/', async (req, res) => {
        try {
            const query = `
                SELECT 
                    c.*,
                    e.nom_prenom,
                    -- Utiliser les données du contrat si disponibles et valides (pas de valeurs de test),
                    -- sinon utiliser les données de l'employé
                    CASE 
                        WHEN c.poste IS NOT NULL 
                            AND c.poste != '' 
                            AND c.poste NOT ILIKE '%test%'
                            AND c.poste NOT ILIKE '%Test%'
                        THEN c.poste
                        ELSE e.poste_actuel
                    END as poste,
                    CASE 
                        WHEN c.service IS NOT NULL 
                            AND c.service != '' 
                            AND c.service NOT ILIKE '%test%'
                            AND c.service NOT ILIKE '%Test%'
                        THEN c.service
                        ELSE COALESCE(e.functional_area, e.entity, e.departement)
                    END as service,
                    c.date_fin,
                    -- Si le salaire n'est pas défini dans le contrat, utiliser le salaire de l'employé
                    COALESCE(c.salaire, e.salaire_net, e.salaire_base) as salaire
                FROM contrats c 
                JOIN employees e ON c.employee_id = e.id 
                ORDER BY c.id DESC
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
                employee_id, 
                type_contrat, 
                date_debut, 
                date_fin, 
                poste, 
                service,
                salaire,
                statut,
                contrat_content
            } = req.body;

            const query = `
                INSERT INTO contrats 
                (employee_id, type_contrat, date_debut, date_fin, poste, service, salaire, statut, contrat_content) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                RETURNING *
            `;

            const values = [
                employee_id, 
                type_contrat, 
                date_debut, 
                date_fin, 
                poste || null, 
                service || null,
                salaire || null,
                statut || 'Actif',
                contrat_content || null
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
            const query = `
                SELECT 
                    c.*,
                    e.nom_prenom,
                    -- Utiliser les données du contrat si disponibles et valides (pas de valeurs de test),
                    -- sinon utiliser les données de l'employé
                    CASE 
                        WHEN c.poste IS NOT NULL 
                            AND c.poste != '' 
                            AND c.poste NOT ILIKE '%test%'
                            AND c.poste NOT ILIKE '%Test%'
                        THEN c.poste
                        ELSE e.poste_actuel
                    END as poste,
                    CASE 
                        WHEN c.service IS NOT NULL 
                            AND c.service != '' 
                            AND c.service NOT ILIKE '%test%'
                            AND c.service NOT ILIKE '%Test%'
                        THEN c.service
                        ELSE COALESCE(e.functional_area, e.entity, e.departement)
                    END as service,
                    -- Utiliser la date de fin du contrat si disponible, sinon utiliser celle de l'employé
                    -- Pour les CDI, la date de fin peut être NULL (contrat à durée indéterminée)
                    COALESCE(c.date_fin, e.date_fin_contrat) as date_fin,
                    -- Si le salaire n'est pas défini dans le contrat, utiliser le salaire de l'employé
                    COALESCE(c.salaire, e.salaire_net, e.salaire_base) as salaire
                FROM contrats c 
                JOIN employees e ON c.employee_id = e.id 
                WHERE c.id = $1
            `;
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
            const query = `
                SELECT c.*, e.nom_prenom 
                FROM contrats c 
                JOIN employees e ON c.employee_id = e.id 
                WHERE e.nom_prenom ILIKE $1
            `;
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
                employee_id, 
                type_contrat, 
                date_debut, 
                date_fin, 
                poste, 
                service,
                salaire,
                statut,
                contrat_content
            } = req.body;

            const query = `
                UPDATE contrats 
                SET employee_id = $1, 
                    type_contrat = $2, 
                    date_debut = $3, 
                    date_fin = $4, 
                    poste = $5, 
                    service = $6,
                    salaire = $7,
                    statut = $8,
                    contrat_content = $9,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $10 
                RETURNING *
            `;

            const values = [
                employee_id, 
                type_contrat, 
                date_debut, 
                date_fin, 
                poste || null, 
                service || null,
                salaire || null,
                statut || 'Actif',
                contrat_content || null,
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
            
            let query = `
                SELECT c.*, e.nom_prenom 
                FROM contrats c 
                JOIN employees e ON c.employee_id = e.id
            `;
            
            if (nom) {
                conditions.push(`e.nom_prenom ILIKE $${paramIndex}`);
                values.push(`%${nom}%`);
                paramIndex++;
            }
            
            if (type) {
                conditions.push(`c.type_contrat = $${paramIndex}`);
                values.push(type);
                paramIndex++;
            }
            
            if (service) {
                conditions.push(`c.service ILIKE $${paramIndex}`);
                values.push(`%${service}%`);
                paramIndex++;
            }
            
            if (dateDebut) {
                conditions.push(`c.date_debut >= $${paramIndex}`);
                values.push(dateDebut);
                paramIndex++;
            }
            
            if (dateFin) {
                conditions.push(`c.date_fin <= $${paramIndex}`);
                values.push(dateFin);
                paramIndex++;
            }
            
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            
            query += ' ORDER BY c.id DESC';
            
            const result = await pool.query(query, values);
            res.json(result.rows);
        } catch (err) {
            console.error('Error searching contrats:', err);
            res.status(500).json({ error: 'Failed to search contrats', details: err.message });
        }
    });

    return router;
};