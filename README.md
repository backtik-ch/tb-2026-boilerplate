# boilerplate

<!-- La description du projet doit être rédigée manuellement. -->

---

## Technologies

| Domaine | Technologies |
|---------|--------------|
| Backend | N/A |
| Frontend | JavaScript (Node.js) • Vite |
| Base de données | N/A |
| Infrastructure | N/A |
| Tests | N/A | 

---

## Architecture 

L’organisation du projet est la suivante.

```text
├── .github/
│   └── workflows/
├── scripts/
│   └── readme-generator/
├── .gitignore
├── package-lock.json
├── package.json
├── README.MD
└── test.json
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
| N/A | Aucune variable d’environnement requise n’a été détectée dans le contexte du projet. |

---

## Base de données

Aucune base de données n’est configurée/détectée dans le contexte du projet.

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
| `npm run generate:readme` | Génère le README à partir du script (charge un fichier `.env` si présent). |
| `npm run docs:readme` | Exécute l’analyse puis la génération du README. |

---

## Documentation complèmentaire

<!-- La documentation supplémentaire du projet doit être indiquée manuellement. -->
