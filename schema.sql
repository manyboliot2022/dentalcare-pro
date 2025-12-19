-- ═══════════════════════════════════════════════════════════════════
-- DentalCare Solo - Schéma de base de données
-- Base de données : PostgreSQL
-- ═══════════════════════════════════════════════════════════════════

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: users (Utilisateurs du cabinet)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'dentiste', -- dentiste, assistant, secretaire, admin
    specialite VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: patients
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE,
    sexe VARCHAR(10), -- M, F
    telephone VARCHAR(20),
    telephone_urgence VARCHAR(20),
    email VARCHAR(255),
    adresse TEXT,
    ville VARCHAR(100),
    profession VARCHAR(100),
    groupe_sanguin VARCHAR(5),
    allergies TEXT,
    antecedents TEXT,
    notes TEXT,
    photo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: appointments (Rendez-vous)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    date_rdv DATE NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME,
    motif VARCHAR(255),
    notes TEXT,
    statut VARCHAR(50) DEFAULT 'planifie', -- planifie, confirme, en_cours, termine, annule, absent
    rappel_sms BOOLEAN DEFAULT false,
    rappel_email BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: actes (Catalogue des actes dentaires)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS actes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    nom VARCHAR(255) NOT NULL,
    categorie VARCHAR(100), -- Soins conservateurs, Chirurgie, Prothèse, Orthodontie, etc.
    description TEXT,
    tarif DECIMAL(12, 2) NOT NULL,
    duree_moyenne INTEGER, -- en minutes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: devis
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS devis (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    montant_total DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    validite_jours INTEGER DEFAULT 30,
    statut VARCHAR(50) DEFAULT 'en_attente', -- en_attente, accepte, refuse, expire, converti
    date_acceptation DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: devis_lignes
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS devis_lignes (
    id SERIAL PRIMARY KEY,
    devis_id INTEGER REFERENCES devis(id) ON DELETE CASCADE,
    acte_id INTEGER REFERENCES actes(id),
    description TEXT,
    dent VARCHAR(10), -- Numéro de la dent
    quantite INTEGER DEFAULT 1,
    prix_unitaire DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: factures
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS factures (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    devis_id INTEGER REFERENCES devis(id),
    montant_total DECIMAL(12, 2) NOT NULL,
    montant_paye DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    statut VARCHAR(50) DEFAULT 'en_attente', -- en_attente, partielle, payee, annulee
    date_echeance DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: facture_lignes
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS facture_lignes (
    id SERIAL PRIMARY KEY,
    facture_id INTEGER REFERENCES factures(id) ON DELETE CASCADE,
    acte_id INTEGER REFERENCES actes(id),
    description TEXT,
    dent VARCHAR(10),
    quantite INTEGER DEFAULT 1,
    prix_unitaire DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: paiements
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS paiements (
    id SERIAL PRIMARY KEY,
    facture_id INTEGER REFERENCES factures(id) ON DELETE CASCADE,
    montant DECIMAL(12, 2) NOT NULL,
    mode_paiement VARCHAR(50), -- especes, carte, virement, cheque, mobile_money
    reference VARCHAR(100),
    notes TEXT,
    date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: ordonnances
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ordonnances (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    contenu TEXT NOT NULL, -- Contenu de l'ordonnance (médicaments, posologie)
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: certificats
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS certificats (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    type_certificat VARCHAR(100), -- medical, aptitude, repos, etc.
    contenu TEXT NOT NULL,
    date_debut DATE,
    date_fin DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: stock (Inventaire)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    categorie VARCHAR(100), -- Consommables, Instruments, Médicaments, etc.
    description TEXT,
    quantite INTEGER DEFAULT 0,
    unite VARCHAR(50), -- pièce, boîte, tube, etc.
    seuil_alerte INTEGER DEFAULT 10,
    prix_unitaire DECIMAL(12, 2),
    fournisseur VARCHAR(255),
    reference_fournisseur VARCHAR(100),
    date_peremption DATE,
    emplacement VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: stock_mouvements
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stock_mouvements (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stock(id) ON DELETE CASCADE,
    type_mouvement VARCHAR(50), -- entree, sortie, ajustement
    quantite INTEGER NOT NULL,
    motif VARCHAR(255),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: settings (Paramètres du cabinet)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    cabinet_nom VARCHAR(255),
    adresse TEXT,
    ville VARCHAR(100),
    pays VARCHAR(100) DEFAULT 'Guinée',
    telephone VARCHAR(20),
    email VARCHAR(255),
    site_web VARCHAR(255),
    logo_url VARCHAR(500),
    devise VARCHAR(10) DEFAULT 'GNF',
    horaires JSONB DEFAULT '{"lundi":{"debut":"08:00","fin":"18:00"},"mardi":{"debut":"08:00","fin":"18:00"},"mercredi":{"debut":"08:00","fin":"18:00"},"jeudi":{"debut":"08:00","fin":"18:00"},"vendredi":{"debut":"08:00","fin":"18:00"},"samedi":{"debut":"08:00","fin":"13:00"},"dimanche":null}',
    jours_feries JSONB DEFAULT '[]',
    duree_rdv_defaut INTEGER DEFAULT 30,
    rappel_sms_heures INTEGER DEFAULT 24,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT settings_single_row CHECK (id = 1)
);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: traitements (Historique des soins)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS traitements (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id),
    acte_id INTEGER REFERENCES actes(id),
    user_id INTEGER REFERENCES users(id),
    dent VARCHAR(10),
    description TEXT,
    notes TEXT,
    date_traitement DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════
-- INDEX pour performances
-- ═══════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_patients_nom ON patients(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date_rdv);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_factures_patient ON factures(patient_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);
CREATE INDEX IF NOT EXISTS idx_devis_patient ON devis(patient_id);
CREATE INDEX IF NOT EXISTS idx_paiements_facture ON paiements(facture_id);
CREATE INDEX IF NOT EXISTS idx_stock_categorie ON stock(categorie);

-- ═══════════════════════════════════════════════════════════════════
-- DONNÉES INITIALES
-- ═══════════════════════════════════════════════════════════════════

-- Utilisateur admin par défaut sera créé par le script init.js
-- avec un mot de passe correctement hashé

-- Paramètres par défaut
INSERT INTO settings (id, cabinet_nom, adresse, ville, telephone, email, devise)
VALUES (1, 'Cabinet Dentaire Dr. Diallo', 'Avenue de la République, Kaloum', 'Conakry', '+224 621 00 00 00', 'contact@dentcab.com', 'GNF')
ON CONFLICT (id) DO NOTHING;

-- Catalogue d'actes dentaires par défaut
INSERT INTO actes (code, nom, categorie, tarif, duree_moyenne) VALUES
('CONS01', 'Consultation', 'Consultation', 100000, 15),
('DET01', 'Détartrage', 'Soins conservateurs', 150000, 30),
('COMP01', 'Obturation composite (1 face)', 'Soins conservateurs', 200000, 30),
('COMP02', 'Obturation composite (2 faces)', 'Soins conservateurs', 250000, 45),
('COMP03', 'Obturation composite (3 faces)', 'Soins conservateurs', 300000, 45),
('AMAL01', 'Obturation amalgame', 'Soins conservateurs', 150000, 30),
('DEV01', 'Dévitalisation monoradiculée', 'Endodontie', 300000, 60),
('DEV02', 'Dévitalisation pluriradiculée', 'Endodontie', 450000, 90),
('EXT01', 'Extraction simple', 'Chirurgie', 100000, 30),
('EXT02', 'Extraction complexe', 'Chirurgie', 200000, 45),
('EXT03', 'Extraction dent de sagesse', 'Chirurgie', 350000, 60),
('COU01', 'Couronne céramique', 'Prothèse', 800000, 60),
('COU02', 'Couronne céramo-métallique', 'Prothèse', 600000, 60),
('BRI01', 'Bridge 3 éléments', 'Prothèse', 2000000, 90),
('IMP01', 'Implant dentaire', 'Implantologie', 3500000, 120),
('BLA01', 'Blanchiment (séance)', 'Esthétique', 500000, 60),
('ORT01', 'Appareil orthodontique', 'Orthodontie', 2500000, 60),
('RAD01', 'Radiographie panoramique', 'Imagerie', 150000, 15),
('RAD02', 'Radiographie rétro-alvéolaire', 'Imagerie', 50000, 10)
ON CONFLICT (code) DO NOTHING;

-- Stock initial
INSERT INTO stock (nom, categorie, quantite, unite, seuil_alerte, prix_unitaire, fournisseur) VALUES
('Gants latex (M)', 'Consommables', 500, 'pièce', 100, 500, 'MedSupply'),
('Gants latex (L)', 'Consommables', 300, 'pièce', 100, 500, 'MedSupply'),
('Masques chirurgicaux', 'Consommables', 200, 'pièce', 50, 300, 'MedSupply'),
('Composite A2', 'Matériaux', 10, 'seringue', 3, 150000, 'DentalPro'),
('Composite A3', 'Matériaux', 8, 'seringue', 3, 150000, 'DentalPro'),
('Anesthésique (Lidocaïne)', 'Médicaments', 50, 'carpule', 20, 5000, 'PharmaDent'),
('Aiguilles anesthésie', 'Consommables', 100, 'pièce', 30, 2000, 'MedSupply'),
('Coton hydrophile', 'Consommables', 20, 'rouleau', 5, 10000, 'MedSupply'),
('Eugénol', 'Matériaux', 5, 'flacon', 2, 25000, 'DentalPro'),
('Ciment verre ionomère', 'Matériaux', 3, 'kit', 1, 200000, 'DentalPro')
ON CONFLICT DO NOTHING;

-- Quelques patients de démonstration
INSERT INTO patients (nom, prenom, date_naissance, sexe, telephone, email, adresse, ville) VALUES
('Camara', 'Fatou', '1985-03-15', 'F', '+224 622 11 22 33', 'fatou.camara@email.com', 'Quartier Almamya', 'Conakry'),
('Barry', 'Mamadou', '1978-07-22', 'M', '+224 623 44 55 66', 'mamadou.barry@email.com', 'Quartier Madina', 'Conakry'),
('Soumah', 'Aissatou', '1992-11-08', 'F', '+224 624 77 88 99', 'aissatou.soumah@email.com', 'Quartier Ratoma', 'Conakry'),
('Diallo', 'Ibrahima', '1965-05-30', 'M', '+224 625 00 11 22', 'ibrahima.diallo@email.com', 'Quartier Kaloum', 'Conakry'),
('Bah', 'Mariama', '2000-01-20', 'F', '+224 626 33 44 55', 'mariama.bah@email.com', 'Quartier Dixinn', 'Conakry')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- MESSAGE DE FIN
-- ═══════════════════════════════════════════════════════════════════
DO $$
BEGIN
    RAISE NOTICE '✅ Base de données DentalCare Solo initialisée avec succès!';
    RAISE NOTICE '📧 Email admin: admin@dentcab.com';
    RAISE NOTICE '🔑 Mot de passe: Admin123!';
END $$;
