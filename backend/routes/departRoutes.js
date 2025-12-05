const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // Fonction helper pour séparer nom_prenom en nom et prenom
    const splitFullName = (fullName) => {
        if (!fullName || fullName === 'Employé supprimé' || fullName === 'null') {
            return { nom: 'Employé', prenom: 'supprimé' };
        }
        
        const nameParts = fullName.trim().split(' ');
        if (nameParts.length === 1) {
            return { nom: nameParts[0], prenom: '' };
        } else {
            const prenom = nameParts.pop();
            const nom = nameParts.join(' ');
            return { nom, prenom };
        }
    };

    // Récupérer tous les départs
    router.get('/', async (req, res) => {
        try {
            // Récupérer les données de depart_history avec LEFT JOIN sur employees
            const queryNew = `
                SELECT dh.*, e.nom_prenom, e.matricule, e.poste_actuel, e.departement
                FROM depart_history dh
                LEFT JOIN employees e ON dh.employee_id = e.id
                ORDER BY dh.date_depart DESC
            `;
            const resultNew = await pool.query(queryNew);
            
            // Récupérer les données de l'ancienne table historique_departs
            const queryOld = `
                SELECT id, nom, prenom, departement, poste, date_depart, motif_depart, commentaire, date_creation
                FROM historique_departs
                ORDER BY date_depart DESC
            `;
            const resultOld = await pool.query(queryOld);
            
            // Transformer les données de depart_history
            const formattedNewResults = resultNew.rows.map(row => {
                const { nom, prenom } = splitFullName(row.nom_prenom);
                return {
                    id: `new_${row.id}`,
                    employee_id: row.employee_id,
                    nom: nom,
                    prenom: prenom,
                    matricule: row.matricule || 'N/A',
                    poste: row.poste_actuel || 'Poste inconnu',
                    departement: row.departement || 'Département inconnu',
                    date_depart: row.date_depart,
                    motif_depart: row.motif_depart,
                    type_depart: row.type_depart,
                    notes: row.notes,
                    created_at: row.created_at,
                    source: 'depart_history'
                };
            });
            
            // Transformer les données de historique_departs
            const formattedOldResults = resultOld.rows.map(row => ({
                id: `old_${row.id}`,
                employee_id: null,
                nom: row.nom,
                prenom: row.prenom,
                matricule: 'N/A',
                poste: row.poste,
                departement: row.departement,
                date_depart: row.date_depart,
                motif_depart: row.motif_depart,
                type_depart: 'Départ',
                notes: row.commentaire,
                created_at: row.date_creation,
                source: 'historique_departs'
            }));
            
            // Combiner et trier les résultats
            const allResults = [...formattedNewResults, ...formattedOldResults]
                .sort((a, b) => new Date(b.date_depart) - new Date(a.date_depart));
            
            res.json(allResults);
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
                conditions.push(`(e.nom_prenom ILIKE $${paramIndex} OR e.matricule ILIKE $${paramIndex} OR e.poste_actuel ILIKE $${paramIndex})`);
                values.push(`%${search}%`);
                paramIndex++;
            }
            
            if (departement) {
                conditions.push(`e.departement = $${paramIndex}`);
                values.push(departement);
                paramIndex++;
            }
            
            if (motif_depart) {
                conditions.push(`dh.motif_depart ILIKE $${paramIndex}`);
                values.push(`%${motif_depart}%`);
                paramIndex++;
            }
            
            if (dateDebut) {
                conditions.push(`dh.date_depart >= $${paramIndex}`);
                values.push(dateDebut);
                paramIndex++;
            }
            
            if (dateFin) {
                conditions.push(`dh.date_depart <= $${paramIndex}`);
                values.push(dateFin);
                paramIndex++;
            }
            
            let query = `
                SELECT dh.*, e.nom_prenom, e.matricule, e.poste_actuel, e.departement
                FROM depart_history dh
                LEFT JOIN employees e ON dh.employee_id = e.id
            `;
            
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            
            query += ' ORDER BY dh.date_depart DESC';
            
            const result = await pool.query(query, values);
            
            // Transformer les données pour un format cohérent
            const formattedResults = result.rows.map(row => {
                const { nom, prenom } = splitFullName(row.nom_prenom);
                return {
                    id: `new_${row.id}`,
                    employee_id: row.employee_id,
                    nom: nom,
                    prenom: prenom,
                    matricule: row.matricule || 'N/A',
                    poste: row.poste_actuel || 'Poste inconnu',
                    departement: row.departement || 'Département inconnu',
                    date_depart: row.date_depart,
                    motif_depart: row.motif_depart,
                    type_depart: row.type_depart,
                    notes: row.notes,
                    created_at: row.created_at,
                    source: 'depart_history'
                };
            });
            
            res.json(formattedResults);
        } catch (err) {
            console.error('Error searching departures:', err);
            res.status(500).json({ error: 'Failed to search departures', details: err.message });
        }
    });

    // Récupérer un départ par ID
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            
            // Extraire le préfixe et l'ID réel
            let realId, tableName;
            if (id.startsWith('new_')) {
                realId = id.substring(4); // Enlever 'new_'
                tableName = 'depart_history';
            } else if (id.startsWith('old_')) {
                realId = id.substring(4); // Enlever 'old_'
                tableName = 'historique_departs';
            } else {
                // Pour la compatibilité avec l'ancien format
                realId = id;
                tableName = 'historique_departs';
            }
            
            let query, result;
            
            if (tableName === 'depart_history') {
                query = `
                    SELECT dh.*, e.nom_prenom, e.matricule, e.poste_actuel, e.departement
                    FROM depart_history dh
                    LEFT JOIN employees e ON dh.employee_id = e.id
                    WHERE dh.id = $1
                `;
                result = await pool.query(query, [realId]);
                
                if (result.rows.length === 0) {
                    return res.status(404).json({ error: 'Departure not found' });
                }

                const row = result.rows[0];
                const { nom, prenom } = splitFullName(row.nom_prenom);
                const formattedResult = {
                    id: `new_${row.id}`,
                    employee_id: row.employee_id,
                    nom: nom,
                    prenom: prenom,
                    matricule: row.matricule || 'N/A',
                    poste: row.poste_actuel || 'Poste inconnu',
                    departement: row.departement || 'Département inconnu',
                    date_depart: row.date_depart,
                    motif_depart: row.motif_depart,
                    type_depart: row.type_depart,
                    notes: row.notes,
                    created_at: row.created_at,
                    source: 'depart_history'
                };
                
                res.json(formattedResult);
            } else {
                query = 'SELECT * FROM historique_departs WHERE id = $1';
                result = await pool.query(query, [realId]);
                
                if (result.rows.length === 0) {
                    return res.status(404).json({ error: 'Departure not found' });
                }

                const row = result.rows[0];
                const formattedResult = {
                    id: `old_${row.id}`,
                    employee_id: null,
                    nom: row.nom,
                    prenom: row.prenom,
                    matricule: 'N/A',
                    poste: row.poste,
                    departement: row.departement,
                    date_depart: row.date_depart,
                    motif_depart: row.motif_depart,
                    type_depart: 'Départ',
                    notes: row.commentaire,
                    created_at: row.date_creation,
                    source: 'historique_departs'
                };
                
                res.json(formattedResult);
            }
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

            // Extraire le préfixe et l'ID réel
            let realId, tableName;
            if (id.startsWith('new_')) {
                realId = id.substring(4); // Enlever 'new_'
                tableName = 'depart_history';
            } else if (id.startsWith('old_')) {
                realId = id.substring(4); // Enlever 'old_'
                tableName = 'historique_departs';
            } else {
                // Pour la compatibilité avec l'ancien format
                realId = id;
                tableName = 'historique_departs';
            }
            
            let query, values, result;
            
            if (tableName === 'depart_history') {
                // Pour depart_history, utiliser les champs de la nouvelle table
                query = `
                    UPDATE depart_history 
                    SET motif_depart = $1, 
                        type_depart = $2, 
                        notes = $3,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $4 
                    RETURNING *
                `;
                values = [
                    motif_depart || commentaire, 
                    statut || 'Départ', 
                    commentaire || '',
                    realId
                ];
            } else {
                // Pour historique_departs, utiliser les champs de l'ancienne table
                query = `
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
                values = [
                    nom, 
                    prenom, 
                    departement, 
                    statut, 
                    poste, 
                    date_depart, 
                    motif_depart, 
                    commentaire,
                    realId
                ];
            }

            result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Departure not found' });
            }

            // Formatter la réponse selon la table
            const row = result.rows[0];
            let formattedResult;
            
            if (tableName === 'depart_history') {
                // Récupérer les données complètes avec LEFT JOIN
                const fullQuery = `
                    SELECT dh.*, e.nom_prenom, e.matricule, e.poste_actuel, e.departement
                    FROM depart_history dh
                    LEFT JOIN employees e ON dh.employee_id = e.id
                    WHERE dh.id = $1
                `;
                const fullResult = await pool.query(fullQuery, [realId]);
                const fullRow = fullResult.rows[0];
                const { nom: nomSplit, prenom: prenomSplit } = splitFullName(fullRow.nom_prenom);
                
                formattedResult = {
                    id: `new_${row.id}`,
                    employee_id: row.employee_id,
                    nom: nomSplit,
                    prenom: prenomSplit,
                    matricule: fullRow.matricule || 'N/A',
                    poste: fullRow.poste_actuel || 'Poste inconnu',
                    departement: fullRow.departement || 'Département inconnu',
                    date_depart: row.date_depart,
                    motif_depart: row.motif_depart,
                    type_depart: row.type_depart,
                    notes: row.notes,
                    created_at: row.created_at,
                    source: 'depart_history'
                };
            } else {
                formattedResult = {
                    id: `old_${row.id}`,
                    employee_id: null,
                    nom: row.nom,
                    prenom: row.prenom,
                    matricule: 'N/A',
                    poste: row.poste,
                    departement: row.departement,
                    date_depart: row.date_depart,
                    motif_depart: row.motif_depart,
                    type_depart: 'Départ',
                    notes: row.commentaire,
                    created_at: row.date_creation,
                    source: 'historique_departs'
                };
            }

            res.json(formattedResult);
        } catch (err) {
            console.error('Error updating departure:', err);
            res.status(500).json({ error: 'Failed to update departure', details: err.message });
        }
    });

    // Supprimer un départ
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            
            // Extraire le préfixe et l'ID réel
            let realId, tableName;
            if (id.startsWith('new_')) {
                realId = id.substring(4); // Enlever 'new_'
                tableName = 'depart_history';
            } else if (id.startsWith('old_')) {
                realId = id.substring(4); // Enlever 'old_'
                tableName = 'historique_departs';
            } else {
                // Pour la compatibilité avec l'ancien format
                realId = id;
                tableName = 'historique_departs';
            }
            
            let query, result;
            
            if (tableName === 'depart_history') {
                query = 'DELETE FROM depart_history WHERE id = $1 RETURNING *';
                result = await pool.query(query, [realId]);
            } else {
                query = 'DELETE FROM historique_departs WHERE id = $1 RETURNING *';
                result = await pool.query(query, [realId]);
            }

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