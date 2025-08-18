const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rh_portal',
  password: 'Cdl202407',
  port: 5432,
});

async function checkAndFixTableStructure() {
  console.log('🔍 Vérification et correction de la structure des tables...\n');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Vérifier la structure de offboarding_history
    console.log('1️⃣ Vérification de la table offboarding_history...');
    const offboardingStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'offboarding_history'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colonnes actuelles de offboarding_history:');
    offboardingStructure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 2. Vérifier si la colonne employee_id existe
    const hasEmployeeId = offboardingStructure.rows.some(col => col.column_name === 'employee_id');
    
    if (!hasEmployeeId) {
      console.log('\n❌ Colonne employee_id manquante dans offboarding_history');
      console.log('🔧 Ajout de la colonne employee_id...');
      
      await client.query(`
        ALTER TABLE offboarding_history 
        ADD COLUMN employee_id INTEGER NOT NULL
      `);
      
      console.log('✅ Colonne employee_id ajoutée');
    } else {
      console.log('\n✅ Colonne employee_id existe déjà');
    }
    
    // 3. Vérifier et corriger depart_history
    console.log('\n2️⃣ Vérification de la table depart_history...');
    const departStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'depart_history'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colonnes actuelles de depart_history:');
    departStructure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 4. Vérifier et corriger recrutement_history
    console.log('\n3️⃣ Vérification de la table recrutement_history...');
    const recrutementStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'recrutement_history'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colonnes actuelles de recrutement_history:');
    recrutementStructure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 5. Recréer les tables si nécessaire avec la bonne structure
    console.log('\n4️⃣ Recréation des tables avec la bonne structure...');
    
    // Supprimer et recréer offboarding_history
    await client.query('DROP TABLE IF EXISTS offboarding_history CASCADE');
    await client.query(`
      CREATE TABLE offboarding_history (
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
    console.log('✅ Table offboarding_history recréée');
    
    // Supprimer et recréer depart_history
    await client.query('DROP TABLE IF EXISTS depart_history CASCADE');
    await client.query(`
      CREATE TABLE depart_history (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL,
        date_depart DATE NOT NULL,
        motif_depart TEXT,
        type_depart VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table depart_history recréée');
    
    // Supprimer et recréer recrutement_history
    await client.query('DROP TABLE IF EXISTS recrutement_history CASCADE');
    await client.query(`
      CREATE TABLE recrutement_history (
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
    console.log('✅ Table recrutement_history recréée');
    
    await client.query('COMMIT');
    console.log('\n🎯 Structure des tables corrigée avec succès !');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur lors de la correction:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAndFixTableStructure().catch(console.error);
