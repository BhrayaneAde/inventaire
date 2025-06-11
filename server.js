const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // pour gérer images base64

// Sert les fichiers statiques du dossier "public" (ton index.html)
app.use(express.static(path.join(__dirname, 'public')));

const FILE_PATH = path.join(__dirname, 'inventaire.json');

// POST : ajouter un écran dans le fichier JSON
app.post('/api/inventaire', (req, res) => {
  const nouvelEcran = req.body;

  if (typeof nouvelEcran !== 'object' || Array.isArray(nouvelEcran) || !nouvelEcran.marque || !nouvelEcran.modele) {
    return res.status(400).json({ message: 'Données invalides' });
  }

  // Lire fichier existant
  fs.readFile(FILE_PATH, 'utf8', (err, data) => {
    let inventaire = [];
    if (!err) {
      try {
        inventaire = JSON.parse(data);
        if (!Array.isArray(inventaire)) inventaire = [];
      } catch {
        inventaire = [];
      }
    }

    // Ajouter le nouvel écran
    inventaire.push(nouvelEcran);

    // Réécrire le fichier
    fs.writeFile(FILE_PATH, JSON.stringify(inventaire, null, 2), (err) => {
      if (err) {
        console.error('Erreur écriture:', err);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      res.status(201).json({ message: 'Écran ajouté avec succès' });
    });
  });
});

// GET : renvoyer l'inventaire complet
app.get('/api/inventaire', (req, res) => {
  fs.readFile(FILE_PATH, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fichier pas encore créé, retourner tableau vide
        return res.json([]);
      }
      console.error('Erreur lecture:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    try {
      const inventaire = JSON.parse(data);
      if (!Array.isArray(inventaire)) return res.json([]);
      res.json(inventaire);
    } catch (parseError) {
      console.error('Erreur parsing JSON:', parseError);
      res.status(500).json({ message: 'Erreur lecture JSON' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
