# boilerplate

<!-- La description du projet doit être rédigée manuellement. -->

---

## Technologies

| Domaine | Technologies |
|---------|--------------|
| Frontend | Vite |
| Tests | Playwright |

---

## Prérequis

Les outils suivants sont nécessaires à l'installation et à l’exécution du projet.

| Outil | Version |
|--------|---------|
| Node.js | – |
| npm | – |

---

## Installation

### Clonage du dépôt distant

```bash
git clone https://github.com/floriansalvi/TB_Boilerplate
cd TB_Boilerplate
```

### Configuration

Copier le fichier d'exemple et adapter les variables d'environnement nécessaires.

```bash
cp .env.example .env
```

### Installation des dépendances

#### Frontend

Installer les dépendances JavaScript du projet.

```bash
npm install
```

### Démarrage

Lancer le serveur de développement.

```bash
npm run dev
```

---

## Variables d’environnement requises

Les variables d’environnement suivantes doivent être adaptées avant l'exécution du projet.

| Variable | Description |
|-----------|-------------|
| APP_NAME | Nom de l’application. |
| APP_TIMEZONE | Fuseau horaire de l’application. |
| APP_URL | URL principale de l’application. |
| APP_LOCALE | Langue par défaut de l’application. |
| APP_FALLBACK_LOCALE | Langue de repli si la langue par défaut n’est pas disponible. |
| VITE_APP_URL | URL de l’application exposée au frontend via Vite. |
| VITE_API_URL | URL de l’API consommée par le frontend. |

---

## Tests

### Exécution

Exécuter les tests end-to-end avec Playwright.

```bash
npx playwright test
```

---

## Commandes utiles

| Commande | Description |
|----------|-------------|
| `npm run build` | Génère le build de production. |
| `npm run readme:analyze` | Analyse le projet pour extraire le contexte technique utilisé par le générateur de README. |
| `npm run readme:generate` | Génère le README à partir du template et du contexte (nécessite un fichier `.env`). |
| `npm run docs:readme` | Enchaîne l’analyse puis la génération du README. |

---

## Documentation complémentaire

<!-- La documentation supplémentaire du projet doit être indiquée manuellement. -->
