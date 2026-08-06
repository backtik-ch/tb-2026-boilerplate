# boilerplate

Ce boilerplate fournit un ensemble d'outils d'automatisation de diverses tâches de développement :
- Génération automatique du README.md
- Génération automatique du CHANGELOG.md et des Release Notes
- Suivi automatique des dépendances et de leurs versions
- Génération automatique des suites de tests E2E Playwright
- Génération automatique des suites de tests unitaires Vitest

---

## Installation

### 1. Cloner le dépôt

Créer un nouveau dépôt à partir du dépôt template ou cloner localement.

```bash
git clone https://github.com/floriansalvi/TB_Boilerplate.git .
```

---

### 2. Installer les dépendances

```bash
npm install
```

---

### 3. Générer le fichier de variables d'environnement

```bash
cp .env.example .env
```

---

### 4. Compléter les variables d'environnement nécessaires

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Clé API de OpenAI |
| `OPENAI_MODEL`| Modèle OpenAI utilisé pour la génération automatique |
| `E2E_BASE_URL`| URL utilisée par les tests Playwright |
| `VITE_APP_URL`| URL de l'application |

---

### 5. Configuration du dépôt GitHub

#### Secrets
- `OPENAI_API_KEY`

#### Variables
- `OPENAI_MODEL`

#### Permissions

Dans :

```
Settings
    └── Actions
        └── General
```

Activer :

```
Workflow permissions
    └── Read and write permissions
```

#### Renvovate

Installer l'application **Mend Renovate** sur le dépôt.

[Installer Renovate](https://github.com/apps/renovate)

---

### 6. (Option) Installer les dépendances séparemmment

#### OpenAI

```bash
npm install openai
```

#### Vitest

```bash
npm install vitest
```

#### Vue Test Utils

```bash
npm install @vue/test-utils
```

#### jsdom

```bash
npm install jsdom
```

#### Playwright

```bash
npm install @playwright/test
```

#### Navigateur Chromium pour Playwright

```bash
npx playwright install chromium
```

## Guide d'utilisation

[Télécharger le Guide d'utilisation](guide-utilisation_boilerplate.pdf)



# Licence

Copyright © 2026 backtik Sàrl

Le code source du boilerplate est distribué sous licence MIT.

Ce document a été réalisé par Florian Salvi pour backtik Sàrl dans le cadre de son Travail de Bachelor, effectué au terme de sa formation en Ingénierie des Médias à la Haute École d’Ingénierie et de Gestion du Canton de Vaud (HEIG-VD)