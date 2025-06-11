const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));

const FILE_PATH = path.join(__dirname, 'inventaire.json');

// Helper pour lire le fichier
function lireInventaire() {
  try {
    const data = fs.readFileSync(FILE_PATH, 'utf8');
    const inventaire = JSON.parse(data);
    return Array.isArray(inventaire) ? inventaire : [];
  } catch {
    return [];
  }
}

// Helper pour écrire dans le fichier
function ecrireInventaire(data) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

// POST : Ajouter un nouvel écran avec ID unique
app.post('/api/inventaire', (req, res) => {
  const nouvelEcran = req.body;

  if (
    typeof nouvelEcran !== 'object' ||
    Array.isArray(nouvelEcran) ||
    !nouvelEcran.marque ||
    !nouvelEcran.modele
  ) {
    return res.status(400).json({ message: 'Données invalides' });
  }

  const inventaire = lireInventaire();
  const newId = inventaire.length > 0 ? Math.max(...inventaire.map(item => item.id || 0)) + 1 : 1;

  const itemAvecId = { id: newId, ...nouvelEcran };
  inventaire.push(itemAvecId);
  ecrireInventaire(inventaire);

  res.status(201).json({ message: 'Écran ajouté avec succès', data: itemAvecId });
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

// PUT : Modifier un écran existant par ID
app.put('/api/inventaire/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const updatedData = req.body;

  if (isNaN(id) || typeof updatedData !== 'object' || Array.isArray(updatedData)) {
    return res.status(400).json({ message: 'Données invalides' });
  }

  const inventaire = lireInventaire();
  const index = inventaire.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Élément non trouvé' });
  }

  inventaire[index] = { id, ...updatedData };
  ecrireInventaire(inventaire);

  res.json({ message: 'Écran modifié avec succès', data: inventaire[index] });
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
