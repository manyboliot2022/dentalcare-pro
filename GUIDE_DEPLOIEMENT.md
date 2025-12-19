# 🚀 Guide de Déploiement - DentalCare Solo

## 📋 Prérequis

- Compte GitHub (manyboliot2022)
- Accès Coolify (panel.medicab.africa)
- Domaine dentcab.com configuré

---

## Étape 1️⃣ : Préparer le code sur GitHub

```bash
# 1. Télécharger et extraire le ZIP
unzip dentalcare-solo.zip

# 2. Aller dans le dossier
cd dentalcare-solo

# 3. Initialiser Git
git init
git add .
git commit -m "DentalCare Solo v1.0 - Application complète"

# 4. Connecter au repo GitHub
git remote add origin https://github.com/manyboliot2022/dentalcare-pro.git

# 5. Forcer le push (remplace le contenu existant)
git branch -M main
git push -u origin main --force
```

---

## Étape 2️⃣ : Configurer Coolify

### A) Créer la base de données (si pas encore fait)

Dans Coolify Terminal du serveur PostgreSQL :
```sql
CREATE DATABASE dentalcare_solo;
```

### B) Variables d'environnement

Dans Coolify > dental-app > Environment Variables :

```env
DATABASE_URL=postgres://postgres:VOTRE_MOT_DE_PASSE@ts8oows8kocc4848cooc80ck:5432/dentalcare_solo
NODE_ENV=production
PORT=3000
JWT_SECRET=dentalcare_solo_jwt_secret_2024_random_secure_key_xyz
ADMIN_EMAIL=admin@dentcab.com
ADMIN_PASSWORD=Admin123!
ADMIN_NOM=Diallo
ADMIN_PRENOM=Mamadou
```

### C) Configuration Build

- **Build Pack** : Nixpacks (ou Dockerfile)
- **Branch** : main
- **Domains** : https://dentcab.com, https://www.dentcab.com

---

## Étape 3️⃣ : Initialiser la base de données

Après le premier déploiement, dans le Terminal Coolify de l'app :

```bash
node database/init.js
```

Cela va :
- Créer toutes les tables
- Créer l'utilisateur admin
- Insérer les données de démo (patients, actes, stock)

---

## Étape 4️⃣ : Tester

1. Aller sur https://dentcab.com
2. Se connecter avec :
   - **Email** : admin@dentcab.com
   - **Mot de passe** : Admin123!

---

## ✅ Fonctionnalités testées

| Fonctionnalité | Statut |
|----------------|--------|
| Page de connexion | ✅ |
| Déconnexion | ✅ |
| Dashboard (stats) | ✅ |
| Liste patients | ✅ |
| Créer patient | ✅ |
| Liste RDV | ✅ |
| Créer RDV | ✅ |
| Stock | ✅ |
| Catalogue actes | ✅ |
| Navigation pages | ✅ |
| Notifications | ✅ |

---

## 🔧 Dépannage

### Erreur "Cannot connect to database"
Vérifier :
1. Le nom de la base de données (dentalcare_solo)
2. Le mot de passe PostgreSQL
3. Le conteneur PostgreSQL est running

### Page blanche
1. Vérifier les logs dans Coolify
2. S'assurer que `public/app.html` existe

### Erreur login
1. Vérifier que `node database/init.js` a été exécuté
2. Vérifier le mot de passe hashé en base

---

## 📱 Personnalisation client

Pour personnaliser pour un client spécifique :

1. Modifier `database/init.js` :
   - ADMIN_NOM, ADMIN_PRENOM
   - cabinet_nom, adresse, ville

2. Relancer l'init :
   ```bash
   # D'abord vider les tables si besoin
   psql -U postgres -d dentalcare_solo -c "TRUNCATE users, settings CASCADE;"
   
   # Puis réinitialiser
   node database/init.js
   ```

---

## 📞 Support

En cas de problème : manyboliot2022@gmail.com
