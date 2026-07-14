# boilerplate

<!-- La description du projet doit être rédigée manuellement. -->

---

## Technologies

| Domaine | Technologies |
|---------|--------------|
| Backend | N/A |
| Frontend | Node.js (npm), Vite |
| Base de données | N/A |
| Infrastructure | GitHub Actions (workflows) |
| Tests | N/A | 

---

## Architecture 

L’organisation du projet est la suivante.

```text
├── .github/
│   └── workflows/
├── scripts/
│   └── readme-generator/
├── .env.example
├── .gitignore
├── package-lock.json
└── package.json
```

---

## Prérequis

Les outils suivants sont nécessaires à l’exécution du projet.

| Outils | Version |
|--------|---------|
| Node.js |  |
| npm |  |

---

## Installation

### 1. Clonage du dépôt distant

```bash
git clone https://github.com/floriansalvi/TB_Boilerplate
cd boilerplate
```

### 2. Configuration

```bash
cp .env.example .env
```

### 3. Dépendances

#### Backend

```bash
# N/A
```

#### Frontend

```bash
npm install
```

### 4. Initialisation

```bash
npm run docs:readme
```

### 5. Démarrage

```bash
npm run dev
```

---

## Variables d’environnement requises

Les variables d’environnement suivantes doivent être adaptées.

| Variable | Description |
|-----------|-------------|
<!-- Aucune variable importante n’a été identifiée automatiquement dans le contexte. -->

---

## Base de données

Aucune base de données n’est configurée d’après le contexte du projet.

### 1. Initialisation

```bash
# N/A
```

### 2. Migrations

```bash
# N/A
```

### 3. Seeders

```bash
# N/A
```

---

## Tests

### 1. Configuration

```bash
# N/A
```

### 2. Exécution

```bash
# N/A
```

---

## Commandes utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarre le serveur de développement Vite. |
| `npm run build` | Génère le build de production. |
| `npm run analyze` | Analyse le projet (script interne de génération de README). |
| `npm run generate:readme` | Génère le README à partir de l’analyse (utilise le fichier `.env`). |
| `npm run docs:readme` | Exécute l’analyse puis la génération du README. |

---

## Documentation complèmentaire

<!-- La documentation supplémentaire du projet doit être indiquée manuellement. -->
