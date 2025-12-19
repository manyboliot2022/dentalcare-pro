/**
 * Script d'initialisation de la base de données
 * Exécuter une fois pour créer les tables et l'utilisateur admin
 * 
 * Usage: node database/init.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});
async function initDatabase() {
  console.log('🚀 Initialisation de la base de données DentalCare Solo...\n');
  
  try {
    // Lire et exécuter le schéma SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Supprimer l'INSERT de l'utilisateur admin du schéma (on le fera avec un vrai hash)
    schema = schema.replace(/INSERT INTO users.*?ON CONFLICT.*?;/gs, '');
    
    console.log('📋 Création des tables...');
    await pool.query(schema);
    console.log('✅ Tables créées avec succès!\n');
    
    // Créer l'utilisateur admin avec un vrai mot de passe hashé
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@dentcab.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminNom = process.env.ADMIN_NOM || 'Diallo';
    const adminPrenom = process.env.ADMIN_PRENOM || 'Mamadou';
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    
    if (existingAdmin.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (email, password, nom, prenom, role, specialite)
         VALUES ($1, $2, $3, $4, 'admin', 'Chirurgien-Dentiste')`,
        [adminEmail, hashedPassword, adminNom, adminPrenom]
      );
      console.log('👤 Utilisateur admin créé:');
      console.log(`   📧 Email: ${adminEmail}`);
      console.log(`   🔑 Mot de passe: ${adminPassword}`);
    } else {
      console.log('👤 Utilisateur admin existe déjà');
    }
    
    // Vérifier les paramètres du cabinet
    const settings = await pool.query('SELECT * FROM settings WHERE id = 1');
    if (settings.rows.length === 0) {
      await pool.query(`
        INSERT INTO settings (id, cabinet_nom, adresse, ville, telephone, email, devise)
        VALUES (1, 'Cabinet Dentaire Dr. ${adminPrenom} ${adminNom}', 'Votre adresse', 'Conakry', '+224 600 00 00 00', $1, 'GNF')
      `, [adminEmail]);
      console.log('\n⚙️  Paramètres du cabinet initialisés');
    }
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ Base de données initialisée avec succès!');
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('🌐 Vous pouvez maintenant démarrer l\'application:');
    console.log('   npm start\n');
    
    console.log('🔐 Connectez-vous avec:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Mot de passe: ${adminPassword}\n`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    if (error.detail) console.error('   Détail:', error.detail);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
