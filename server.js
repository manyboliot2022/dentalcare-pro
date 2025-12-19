/**
 * DentalCare Solo - Serveur Principal
 * Application de gestion de cabinet dentaire mono-client
 */

require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════════
// CONFIGURATION BASE DE DONNÉES
// ═══════════════════════════════════════════════════════════
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});
// Test de connexion DB
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Base de données connectée'))
  .catch(err => console.error('❌ Erreur DB:', err.message));

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Servir les fichiers statiques
app.use('/public', express.static(path.join(__dirname, 'public')));

// ═══════════════════════════════════════════════════════════
// AUTHENTIFICATION
// ═══════════════════════════════════════════════════════════
const JWT_SECRET = process.env.JWT_SECRET || 'dentalcare_secret_key_2024';

// Middleware de vérification JWT
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.redirect('/login');
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.redirect('/login');
  }
};

// ═══════════════════════════════════════════════════════════
// PAGES HTML
// ═══════════════════════════════════════════════════════════

// Page de connexion
app.get('/login', (req, res) => {
  // Si déjà connecté, rediriger vers l'app
  const token = req.cookies.token;
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      return res.redirect('/');
    } catch (e) {
      res.clearCookie('token');
    }
  }
  
  res.send(getLoginPage());
});

// Traitement du login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.send(getLoginPage('Email ou mot de passe incorrect'));
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.send(getLoginPage('Email ou mot de passe incorrect'));
    }
    
    // Créer le token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        nom: user.nom, 
        prenom: user.prenom,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Définir le cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 heures
    });
    
    res.redirect('/');
    
  } catch (err) {
    console.error('Erreur login:', err);
    res.send(getLoginPage('Erreur de connexion. Veuillez réessayer.'));
  }
});

// Déconnexion
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// Application principale (protégée)
app.get('/', authMiddleware, (req, res) => {
  res.send(getAppPage(req.user));
});

// ═══════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Récupérer l'utilisateur connecté
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ───────────────────────────────────────────────────────────
// API PATIENTS
// ───────────────────────────────────────────────────────────
app.get('/api/patients', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM patients ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur patients:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/patients/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM patients WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur patient:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/patients', authMiddleware, async (req, res) => {
  const { nom, prenom, date_naissance, telephone, email, adresse, ville, sexe, groupe_sanguin, allergies, antecedents } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO patients (nom, prenom, date_naissance, telephone, email, adresse, ville, sexe, groupe_sanguin, allergies, antecedents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [nom, prenom, date_naissance, telephone, email, adresse, ville, sexe, groupe_sanguin, allergies, antecedents]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur création patient:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/patients/:id', authMiddleware, async (req, res) => {
  const { nom, prenom, date_naissance, telephone, email, adresse, ville, sexe, groupe_sanguin, allergies, antecedents } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE patients SET nom=$1, prenom=$2, date_naissance=$3, telephone=$4, email=$5, 
       adresse=$6, ville=$7, sexe=$8, groupe_sanguin=$9, allergies=$10, antecedents=$11, updated_at=NOW()
       WHERE id = $12 RETURNING *`,
      [nom, prenom, date_naissance, telephone, email, adresse, ville, sexe, groupe_sanguin, allergies, antecedents, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur update patient:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/patients/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM patients WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur delete patient:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ───────────────────────────────────────────────────────────
// API RENDEZ-VOUS
// ───────────────────────────────────────────────────────────
app.get('/api/appointments', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, p.nom as patient_nom, p.prenom as patient_prenom, p.telephone as patient_telephone
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      ORDER BY a.date_rdv DESC, a.heure_debut ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur appointments:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/appointments', authMiddleware, async (req, res) => {
  const { patient_id, date_rdv, heure_debut, heure_fin, motif, notes, statut } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO appointments (patient_id, date_rdv, heure_debut, heure_fin, motif, notes, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [patient_id, date_rdv, heure_debut, heure_fin, motif, notes, statut || 'planifie']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur création RDV:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/appointments/:id', authMiddleware, async (req, res) => {
  const { patient_id, date_rdv, heure_debut, heure_fin, motif, notes, statut } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE appointments SET patient_id=$1, date_rdv=$2, heure_debut=$3, heure_fin=$4, 
       motif=$5, notes=$6, statut=$7, updated_at=NOW()
       WHERE id = $8 RETURNING *`,
      [patient_id, date_rdv, heure_debut, heure_fin, motif, notes, statut, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur update RDV:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/appointments/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM appointments WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur delete RDV:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ───────────────────────────────────────────────────────────
// API ACTES (Catalogue)
// ───────────────────────────────────────────────────────────
app.get('/api/actes', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM actes ORDER BY categorie, nom');
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur actes:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/actes', authMiddleware, async (req, res) => {
  const { code, nom, categorie, description, tarif, duree_moyenne } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO actes (code, nom, categorie, description, tarif, duree_moyenne)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [code, nom, categorie, description, tarif, duree_moyenne]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur création acte:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/actes/:id', authMiddleware, async (req, res) => {
  const { code, nom, categorie, description, tarif, duree_moyenne } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE actes SET code=$1, nom=$2, categorie=$3, description=$4, tarif=$5, duree_moyenne=$6
       WHERE id = $7 RETURNING *`,
      [code, nom, categorie, description, tarif, duree_moyenne, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur update acte:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ───────────────────────────────────────────────────────────
// API DEVIS
// ───────────────────────────────────────────────────────────
app.get('/api/devis', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, p.nom as patient_nom, p.prenom as patient_prenom
      FROM devis d
      LEFT JOIN patients p ON d.patient_id = p.id
      ORDER BY d.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur devis:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/devis/:id', authMiddleware, async (req, res) => {
  try {
    const devis = await pool.query(`
      SELECT d.*, p.nom as patient_nom, p.prenom as patient_prenom, p.telephone, p.email
      FROM devis d
      LEFT JOIN patients p ON d.patient_id = p.id
      WHERE d.id = $1
    `, [req.params.id]);
    
    const lignes = await pool.query(`
      SELECT dl.*, a.nom as acte_nom
      FROM devis_lignes dl
      LEFT JOIN actes a ON dl.acte_id = a.id
      WHERE dl.devis_id = $1
    `, [req.params.id]);
    
    res.json({ ...devis.rows[0], lignes: lignes.rows });
  } catch (err) {
    console.error('Erreur devis:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/devis', authMiddleware, async (req, res) => {
  const { patient_id, lignes, notes, validite_jours } = req.body;
  
  try {
    // Générer numéro de devis
    const countResult = await pool.query('SELECT COUNT(*) FROM devis');
    const numero = `DEV-${new Date().getFullYear()}-${String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0')}`;
    
    // Calculer le montant total
    let montant_total = 0;
    for (const ligne of lignes) {
      montant_total += ligne.quantite * ligne.prix_unitaire;
    }
    
    // Créer le devis
    const devisResult = await pool.query(
      `INSERT INTO devis (numero, patient_id, montant_total, notes, validite_jours, statut)
       VALUES ($1, $2, $3, $4, $5, 'en_attente') RETURNING *`,
      [numero, patient_id, montant_total, notes, validite_jours || 30]
    );
    
    const devis_id = devisResult.rows[0].id;
    
    // Créer les lignes
    for (const ligne of lignes) {
      await pool.query(
        `INSERT INTO devis_lignes (devis_id, acte_id, description, quantite, prix_unitaire)
         VALUES ($1, $2, $3, $4, $5)`,
        [devis_id, ligne.acte_id, ligne.description, ligne.quantite, ligne.prix_unitaire]
      );
    }
    
    res.json(devisResult.rows[0]);
  } catch (err) {
    console.error('Erreur création devis:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ───────────────────────────────────────────────────────────
// API FACTURES
// ───────────────────────────────────────────────────────────
app.get('/api/factures', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, p.nom as patient_nom, p.prenom as patient_prenom
      FROM factures f
      LEFT JOIN patients p ON f.patient_id = p.id
      ORDER BY f.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur factures:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/factures', authMiddleware, async (req, res) => {
  const { patient_id, devis_id, lignes, notes } = req.body;
  
  try {
    // Générer numéro de facture
    const countResult = await pool.query('SELECT COUNT(*) FROM factures');
    const numero = `FAC-${new Date().getFullYear()}-${String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0')}`;
    
    // Calculer le montant total
    let montant_total = 0;
    for (const ligne of lignes) {
      montant_total += ligne.quantite * ligne.prix_unitaire;
    }
    
    // Créer la facture
    const factureResult = await pool.query(
      `INSERT INTO factures (numero, patient_id, devis_id, montant_total, montant_paye, notes, statut)
       VALUES ($1, $2, $3, $4, 0, $5, 'en_attente') RETURNING *`,
      [numero, patient_id, devis_id, montant_total, notes]
    );
    
    const facture_id = factureResult.rows[0].id;
    
    // Créer les lignes
    for (const ligne of lignes) {
      await pool.query(
        `INSERT INTO facture_lignes (facture_id, acte_id, description, quantite, prix_unitaire)
         VALUES ($1, $2, $3, $4, $5)`,
        [facture_id, ligne.acte_id, ligne.description, ligne.quantite, ligne.prix_unitaire]
      );
    }
    
    res.json(factureResult.rows[0]);
  } catch (err) {
    console.error('Erreur création facture:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ───────────────────────────────────────────────────────────
// API PAIEMENTS
// ───────────────────────────────────────────────────────────
app.post('/api/paiements', authMiddleware, async (req, res) => {
  const { facture_id, montant, mode_paiement, reference, notes } = req.body;
  
  try {
    // Créer le paiement
    const paiementResult = await pool.query(
      `INSERT INTO paiements (facture_id, montant, mode_paiement, reference, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [facture_id, montant, mode_paiement, reference, notes]
    );
    
    // Mettre à jour le montant payé sur la facture
    await pool.query(`
      UPDATE factures 
      SET montant_paye = montant_paye + $1,
          statut = CASE 
            WHEN montant_paye + $1 >= montant_total THEN 'payee'
            WHEN montant_paye + $1 > 0 THEN 'partielle'
            ELSE statut
          END
      WHERE id = $2
    `, [montant, facture_id]);
    
    res.json(paiementResult.rows[0]);
  } catch (err) {
    console.error('Erreur paiement:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ───────────────────────────────────────────────────────────
// API STOCK
// ───────────────────────────────────────────────────────────
app.get('/api/stock', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stock ORDER BY nom');
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur stock:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/stock', authMiddleware, async (req, res) => {
  const { nom, categorie, quantite, unite, seuil_alerte, prix_unitaire, fournisseur } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO stock (nom, categorie, quantite, unite, seuil_alerte, prix_unitaire, fournisseur)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nom, categorie, quantite, unite, seuil_alerte, prix_unitaire, fournisseur]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur création stock:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/stock/:id', authMiddleware, async (req, res) => {
  const { nom, categorie, quantite, unite, seuil_alerte, prix_unitaire, fournisseur } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE stock SET nom=$1, categorie=$2, quantite=$3, unite=$4, seuil_alerte=$5, 
       prix_unitaire=$6, fournisseur=$7, updated_at=NOW()
       WHERE id = $8 RETURNING *`,
      [nom, categorie, quantite, unite, seuil_alerte, prix_unitaire, fournisseur, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur update stock:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ───────────────────────────────────────────────────────────
// API ORDONNANCES
// ───────────────────────────────────────────────────────────
app.get('/api/ordonnances', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, p.nom as patient_nom, p.prenom as patient_prenom
      FROM ordonnances o
      LEFT JOIN patients p ON o.patient_id = p.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur ordonnances:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/ordonnances', authMiddleware, async (req, res) => {
  const { patient_id, contenu, notes } = req.body;
  
  try {
    const countResult = await pool.query('SELECT COUNT(*) FROM ordonnances');
    const numero = `ORD-${new Date().getFullYear()}-${String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0')}`;
    
    const result = await pool.query(
      `INSERT INTO ordonnances (numero, patient_id, contenu, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [numero, patient_id, contenu, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur création ordonnance:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ───────────────────────────────────────────────────────────
// API CERTIFICATS
// ───────────────────────────────────────────────────────────
app.get('/api/certificats', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, p.nom as patient_nom, p.prenom as patient_prenom
      FROM certificats c
      LEFT JOIN patients p ON c.patient_id = p.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur certificats:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/certificats', authMiddleware, async (req, res) => {
  const { patient_id, type_certificat, contenu, date_debut, date_fin, notes } = req.body;
  
  try {
    const countResult = await pool.query('SELECT COUNT(*) FROM certificats');
    const numero = `CERT-${new Date().getFullYear()}-${String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0')}`;
    
    const result = await pool.query(
      `INSERT INTO certificats (numero, patient_id, type_certificat, contenu, date_debut, date_fin, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [numero, patient_id, type_certificat, contenu, date_debut, date_fin, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur création certificat:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ───────────────────────────────────────────────────────────
// API STATISTIQUES DASHBOARD
// ───────────────────────────────────────────────────────────
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    // RDV aujourd'hui
    const rdvToday = await pool.query(`
      SELECT COUNT(*) FROM appointments WHERE date_rdv = CURRENT_DATE
    `);
    
    // Total patients
    const totalPatients = await pool.query('SELECT COUNT(*) FROM patients');
    
    // CA du mois
    const caMonth = await pool.query(`
      SELECT COALESCE(SUM(montant_paye), 0) as total
      FROM factures
      WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);
    
    // Impayés
    const impayes = await pool.query(`
      SELECT COALESCE(SUM(montant_total - montant_paye), 0) as total
      FROM factures
      WHERE statut != 'payee'
    `);
    
    // RDV de la semaine
    const rdvWeek = await pool.query(`
      SELECT COUNT(*) FROM appointments 
      WHERE date_rdv >= CURRENT_DATE 
      AND date_rdv < CURRENT_DATE + INTERVAL '7 days'
    `);
    
    // Stock en alerte
    const stockAlerte = await pool.query(`
      SELECT COUNT(*) FROM stock WHERE quantite <= seuil_alerte
    `);
    
    res.json({
      rdv_today: parseInt(rdvToday.rows[0].count),
      total_patients: parseInt(totalPatients.rows[0].count),
      ca_month: parseFloat(caMonth.rows[0].total),
      impayes: parseFloat(impayes.rows[0].total),
      rdv_week: parseInt(rdvWeek.rows[0].count),
      stock_alerte: parseInt(stockAlerte.rows[0].count)
    });
  } catch (err) {
    console.error('Erreur stats:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ───────────────────────────────────────────────────────────
// API PARAMÈTRES CABINET
// ───────────────────────────────────────────────────────────
app.get('/api/settings', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Erreur settings:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/settings', authMiddleware, async (req, res) => {
  const { cabinet_nom, adresse, ville, telephone, email, devise, horaires, jours_feries } = req.body;
  
  try {
    const result = await pool.query(`
      INSERT INTO settings (id, cabinet_nom, adresse, ville, telephone, email, devise, horaires, jours_feries)
      VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        cabinet_nom = $1, adresse = $2, ville = $3, telephone = $4, 
        email = $5, devise = $6, horaires = $7, jours_feries = $8, updated_at = NOW()
      RETURNING *
    `, [cabinet_nom, adresse, ville, telephone, email, devise, JSON.stringify(horaires), JSON.stringify(jours_feries)]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur update settings:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ═══════════════════════════════════════════════════════════
// FONCTIONS GÉNÉRATION HTML
// ═══════════════════════════════════════════════════════════

function getLoginPage(error = null) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connexion - DentalCare Pro</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'DM Sans', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0891b2 100%);
        }
        .login-container {
            background: white;
            border-radius: 24px;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
            width: 100%;
            max-width: 420px;
            padding: 48px;
            margin: 20px;
        }
        .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 32px;
        }
        .logo-icon {
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #0891b2 0%, #22d3ee 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .logo-icon i { width: 32px; height: 32px; }
        .logo-text {
            font-size: 1.75rem;
            font-weight: 700;
            color: #0f172a;
        }
        .logo-text span { color: #0891b2; }
        h1 {
            text-align: center;
            font-size: 1.5rem;
            color: #1e293b;
            margin-bottom: 8px;
        }
        .subtitle {
            text-align: center;
            color: #64748b;
            margin-bottom: 32px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            font-weight: 500;
            color: #374151;
            margin-bottom: 8px;
        }
        input {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 1rem;
            font-family: inherit;
            transition: all 0.2s ease;
        }
        input:focus {
            outline: none;
            border-color: #0891b2;
            box-shadow: 0 0 0 4px rgba(8, 145, 178, 0.1);
        }
        .error-message {
            background: #fee2e2;
            color: #dc2626;
            padding: 12px 16px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .error-message i { width: 20px; height: 20px; }
        button {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -10px rgba(8, 145, 178, 0.5);
        }
        button i { width: 20px; height: 20px; }
        .footer {
            text-align: center;
            margin-top: 24px;
            color: #94a3b8;
            font-size: 0.85rem;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <div class="logo-icon"><i data-lucide="smile"></i></div>
            <div class="logo-text">Dental<span>Care</span></div>
        </div>
        <h1>Bienvenue</h1>
        <p class="subtitle">Connectez-vous à votre cabinet</p>
        
        ${error ? `<div class="error-message"><i data-lucide="alert-circle"></i>${error}</div>` : ''}
        
        <form method="POST" action="/login">
            <div class="form-group">
                <label for="email">Adresse email</label>
                <input type="email" id="email" name="email" required placeholder="dr.exemple@cabinet.com">
            </div>
            <div class="form-group">
                <label for="password">Mot de passe</label>
                <input type="password" id="password" name="password" required placeholder="••••••••">
            </div>
            <button type="submit">
                <i data-lucide="log-in"></i>
                Se connecter
            </button>
        </form>
        
        <p class="footer">DentalCare Pro © 2024</p>
    </div>
    <script>lucide.createIcons();</script>
</body>
</html>`;
}

function getAppPage(user) {
  // L'application principale sera servie depuis le fichier HTML statique
  // avec injection des données utilisateur
  const fs = require('fs');
  const appHtml = fs.readFileSync(path.join(__dirname, 'public', 'app.html'), 'utf8');
  
  // Injecter les données utilisateur
  return appHtml.replace('{{USER_DATA}}', JSON.stringify(user));
}

// ═══════════════════════════════════════════════════════════
// DÉMARRAGE SERVEUR
// ═══════════════════════════════════════════════════════════
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🦷 DentalCare Pro - Serveur démarré                   ║
║                                                            ║
║     URL: http://localhost:${PORT}                            ║
║     Mode: ${process.env.NODE_ENV || 'development'}                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
