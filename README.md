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
| `BP_OPENAI_API_KEY` | Clé API OpenAI réservée aux générateurs README et Vitest du boilerplate |
| `BP_OPENAI_MODEL`| Modèle OpenAI utilisé par les générateurs README et Vitest du boilerplate |
| `BTK_CHANGELOG_API_KEY` | Clé API du fournisseur LLM réservée à la génération du changelog |
| `BTK_CHANGELOG_MODEL` | Identifiant du modèle LLM utilisé pour le changelog |
| `BTK_CHANGELOG_BASE_URL` | URL de base OpenAI-compatible ; laisser vide pour OpenAI |
| `BP_E2E_BASE_URL`| URL utilisée par les tests Playwright du boilerplate |
| `VITE_BP_APP_URL`| URL de l'application utilisée par le boilerplate |
| `VITE_BP_API_URL`| URL de l'API éventuelle utilisée par le boilerplate |

Le préfixe `BP` signifie *boilerplate* et reste réservé aux générateurs README et Vitest. Le préfixe `BTK_CHANGELOG` identifie sans ambiguïté la configuration du changelog. Les variables `VITE_BP_*` conservent le préfixe requis par Vite.

---

### 5. Configuration du dépôt GitHub

#### Secrets
- `BP_OPENAI_API_KEY`
- `BTK_CHANGELOG_API_KEY`

#### Variables
- `BP_OPENAI_MODEL`
- `BTK_CHANGELOG_MODEL`
- `BTK_CHANGELOG_BASE_URL`

Le générateur de changelog appelle une API compatible avec OpenAI Responses. Pour OpenAI, laisser `BTK_CHANGELOG_BASE_URL` vide. Pour DeepSeek, utiliser `https://api.deepseek.com` avec le modèle `deepseek-v4-flash`.

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

---

## Guide d'utilisation

> La configuration du changelog documentée dans ce README est la source de vérité.
> Le guide PDF historique doit être régénéré depuis son fichier source avant d'être
> utilisé pour cette configuration.

[Télécharger le Guide d'utilisation](docs/guide-utilisation_boilerplate.pdf)

---

## Licence

Copyright © 2026 backtik Sàrl

Le code source du boilerplate est distribué sous licence MIT.

Ce document a été réalisé par Florian Salvi pour backtik Sàrl dans le cadre de son Travail de Bachelor, effectué au terme de sa formation en Ingénierie des Médias à la Haute École d’Ingénierie et de Gestion du Canton de Vaud (HEIG-VD)
