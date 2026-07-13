# boilerplate

<!-- La description du projet doit être rédigée manuellement. -->

---

## Technologies

| Domaine | Technologies |
|---------|--------------|
| Backend | Non applicable (aucune dépendance backend détectée) |
| Frontend | Node.js (npm), Vite |
| Base de données | Non applicable (aucune base de données détectée) |
| Infrastructure | GitHub Actions (workflows) |
| Tests | Non déterminé (aucun framework de test détecté) | 

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
└── README.MD
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
git clone https://github.com/floriansalvi/TB_Boilerplate.git
cd boilerplate
```

### 2. Configuration

```bash
cp .env.example .env
```

### 3. Dépendances

#### Backend

```bash
# Non applicable
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
| Aucune | Aucune variable d’environnement requise détectée. |

---

## Base de données

Aucune base de données n’a été détectée dans le projet.

### 1. Initialisation

```bash
# Non applicable
```

### 2. Migrations

```bash
# Non applicable
```

### 3. Seeders

```bash
# Non applicable
```

---

## Tests

### 1. Configuration

```bash
# Non déterminé (aucun outil de test détecté)
```

### 2. Exécution

```bash
# Non déterminé (aucun script de test détecté)
```

---

## Commandes utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarre le serveur de développement Vite |
| `npm run build` | Construit le projet (build Vite) |
| `npm run analyze` | Analyse le projet (script interne) |
| `npm run generate:readme` | Génère le README (script interne) |
| `npm run docs:readme` | Enchaîne l’analyse puis la génération du README |

---

## Documentation complèmentaire

<!-- La documentation supplémentaire du projet doit être indiquée manuellement. -->