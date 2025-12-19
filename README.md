# 🦷 DentalCare Solo

Application de gestion de cabinet dentaire - Version mono-client.

## 📋 Fonctionnalités

- **Dashboard** : Vue d'ensemble avec statistiques en temps réel
- **Patients** : Gestion complète des dossiers patients
- **Agenda** : Planification des rendez-vous
- **Devis** : Création et suivi des devis
- **Factures** : Facturation avec suivi des paiements
- **Caisse** : Gestion des encaissements
- **Ordonnances** : Génération d'ordonnances médicales
- **Certificats** : Création de certificats médicaux
- **Stock** : Gestion de l'inventaire
- **Rapports** : Statistiques et analyses
- **Catalogue** : Tarification personnalisable des actes

## 🚀 Installation

### Prérequis

- Node.js 18+
- PostgreSQL 14+

### Configuration

1. Cloner le repository :
```bash
git clone https://github.com/manyboliot2022/dentalcare-pro.git
cd dentalcare-pro
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer l'environnement :
```bash
cp .env.example .env
# Modifier .env avec vos paramètres
```

4. Initialiser la base de données :
```bash
node database/init.js
```

5. Démarrer l'application :
```bash
npm start
```

## 🐳 Déploiement Docker

```bash
docker build -t dentalcare-solo .
docker run -p 3000:3000 --env-file .env dentalcare-solo
```

## ⚙️ Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `DATABASE_URL` | URL de connexion PostgreSQL | - |
| `PORT` | Port du serveur | 3000 |
| `NODE_ENV` | Environnement (development/production) | development |
| `JWT_SECRET` | Clé secrète pour les tokens | - |
| `ADMIN_EMAIL` | Email de l'admin initial | admin@dentcab.com |
| `ADMIN_PASSWORD` | Mot de passe de l'admin initial | Admin123! |

## 📁 Structure du projet

```
dentalcare-solo/
├── server.js           # Serveur principal
├── public/
│   └── app.html        # Application frontend
├── database/
│   ├── schema.sql      # Schéma de base de données
│   └── init.js         # Script d'initialisation
├── Dockerfile          # Configuration Docker
├── package.json        # Dépendances Node.js
└── .env.example        # Template de configuration
```

## 🔐 Connexion par défaut

- **Email** : admin@dentcab.com
- **Mot de passe** : Admin123!

⚠️ Changez le mot de passe après la première connexion !

## 📄 Licence

Propriétaire - MANY / HealthAFR

## 🤝 Support

Contact : support@dentcab.com
