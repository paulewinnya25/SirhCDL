const { Pool } = require('pg');

// Configuration de la base de données
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rh_portal',
  password: 'Cdl202407',
  port: 5432,
});

async function addMissingColumns() {
  console.log('🔧 Ajout des colonnes manquantes à la table employees...\n');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Liste des colonnes à ajouter
    const columnsToAdd = [
      {
        name: 'departement',
        type: 'VARCHAR(255)',
        defaultValue: "''"
      },
      {
        name: 'domaine_fonctionnel',
        type: 'VARCHAR(255)',
        defaultValue: "''"
      },
      {
        name: 'statut',
        type: 'VARCHAR(50)',
        defaultValue: "'Actif'"
      },
      {
        name: 'date_depart',
        type: 'DATE',
        defaultValue: null
      },
      {
        name: 'updated_at',
        type: 'TIMESTAMP',
        defaultValue: 'CURRENT_TIMESTAMP'
      }
    ];
    
    // Vérifier et ajouter chaque colonne
    for (const column of columnsToAdd) {
      try {
        // Vérifier si la colonne existe déjà
        const checkResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'employees' 
          AND column_name = $1
        `, [column.name]);
        
        if (checkResult.rows.length === 0) {
          // La colonne n'existe pas, l'ajouter
          let alterQuery;
          if (column.defaultValue === null) {
            alterQuery = `ALTER TABLE employees ADD COLUMN ${column.name} ${column.type}`;
          } else {
            alterQuery = `ALTER TABLE employees ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.defaultValue}`;
          }
          
          await client.query(alterQuery);
          console.log(`✅ Colonne '${column.name}' ajoutée`);
        } else {
          console.log(`ℹ️ Colonne '${column.name}' existe déjà`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de l'ajout de la colonne '${column.name}':`, error.message);
      }
    }
    
    // Créer les tables manquantes si elles n'existent pas
    console.log('\n🏗️ Création des tables manquantes...');
    
    // Table offboarding_history
    await client.query(`
      CREATE TABLE IF NOT EXISTS offboarding_history (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL,
        date_depart DATE NOT NULL,
        motif_depart TEXT,
        checklist JSONB,
        documents TEXT[],
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table offboarding_history créée/vérifiée');
    
    // Table depart_history
    await client.query(`
      CREATE TABLE IF NOT EXISTS depart_history (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL,
        date_depart DATE NOT NULL,
        motif_depart TEXT,
        type_depart VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table depart_history créée/vérifiée');
    
    // Table recrutement_history
    await client.query(`
      CREATE TABLE IF NOT EXISTS recrutement_history (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL,
        date_recrutement DATE NOT NULL,
        date_fin DATE,
        poste_recrute VARCHAR(255),
        type_contrat VARCHAR(100),
        salaire_propose DECIMAL(10, 2),
        source_recrutement VARCHAR(255),
        statut VARCHAR(50) DEFAULT 'Recruté',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table recrutement_history créée/vérifiée');
    
    await client.query('COMMIT');
    console.log('\n🎯 Toutes les colonnes et tables ont été ajoutées avec succès !');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur lors de l\'ajout des colonnes:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter le script
addMissingColumns().catch(console.error);
