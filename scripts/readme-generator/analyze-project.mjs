// Importer le module 'fs' pour la manipulation des fichiers
import fs from "fs";
// Importer le module 'path' pour la manipulation des chemins de fichiers
import path from "path";
// Importer le module 'child_process' pour exécuter des commandes shell
import { execSync } from "child_process";

// Définir le chemin racine du projet
const root = path.resolve(process.cwd());
// Définir le chemin de sortie pour le fichier JSON de contexte du projet
const outputPath = path.join(root, "scripts/readme-generator/project-context.json");

// Vérifier si un fichier existe à un chemin donné
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

// Lire le contenu d'un fichier s'il existe, sinon retourner null
function readFileIfExists(filePath) {
    return fileExists(filePath) ? fs.readFileSync(filePath, "utf-8") : null;
}

// Lire et analyser un fichier JSON s'il existe, sinon retourner null
function readJsonFileIfExists(filePath) {
    const content = readFileIfExists(filePath);
    if(content === null) return null;
    try{
        return JSON.parse(content);
    } catch {
        return null;
    }
}

// Lister les fichiers dans un répertoire donné et en retourner des chemins relatifs
function listFilesInDirectory(directoryPath) {
    if (!fileExists(directoryPath)) return [];
    return fs.readdirSync(directoryPath).map(file => path.relative(root, path.join(directoryPath, file)));
}

// Obtenir l'URL du dépôt Git
function getGitRepoUrl() {
    try {
        return execSync("git config --get remote.origin.url", {
            cwd: root,
            encoding: "utf-8"
        }).trim();
    } catch {
        return null;
    }
}

// Générer un arbre du projet en se basant sur les chemins importants
function getProjectTree(directoryPath = root, depth = 0, maxDepth = 2, lines = []) {
    const importantPaths = [
        'app',
        'config',
        'database',
        'resources',
        'routes',
        'tests',
        'docker',
        'Dockerfile',
        'docker-compose.yml',
        'docker-compose.override.yml',
        'composer.json',
        'package.json',
        'vite.config.js',
        'playwright.config.js',
        'phpunit.xml',
    ]

    return importantPaths
        .filter((item) => fileExists(path.join(root, item)))
        .map((item) => {
            const itemPath = path.join(root, item);
            const isDirectory = fs.statSync(itemPath).isDirectory();

            return `├── ${item}${isDirectory ? '/' : ''}`;
        })
}

// Obtenir les variables d'environnement du fichier .env ou .env.example
function getEnvVariables(envContent) {
    if (!envContent) return [];

    return envContent
        .split("\n")
        .filter((line) => line.trim() && !line.trim().startsWith("#"))
        .map((line) => line.split("=")[0].trim())
        .filter(Boolean);
}

// Filtrer les variables d'environnement importantes à partir de leur préfixe
function getImportantEnvVariables(envVariables) {
    const prefixes = [
        'APP_',
        'CACHE_',
        'DB_',
        'DEFAULT_',
        'MAIL_',
        'QUEUE_',
        'REDIS_',
        'SESSION_',
        'VITE_',
    ];
    
    return envVariables.filter((variable) =>
        prefixes.some((prefix) => variable.startsWith(prefix))
    );
}

// Obtenir les technologies backend à partir du fichier composer.json
function getBackendTechnologies(composerJson) {
    if (!composerJson) return [];

    const dependencies = {
        ...composerJson.require,
        ...composerJson["require-dev"]
    };

    const technologies = [];

    if (dependencies["laravel/framework"]) technologies.push(`Laravel ${dependencies["laravel/framework"]}`);
    if (dependencies["php"]) technologies.push(`PHP ${dependencies["php"]}`);
    if (dependencies["pestphp/pest"]) technologies.push(`Pest ${dependencies["pestphp/pest"]}`);
    if (dependencies["phpunit/phpunit"]) technologies.push(`PHPUnit ${dependencies["phpunit/phpunit"]}`);

    return technologies;
}

// Obtenir les technologies frontend à partir du fichier package.json
function getFrontendTechnologies(packageJson) {
    if (!packageJson) return [];

    const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };

    const technologies = [];

    if (dependencies["vue"]) technologies.push(`Vue ${dependencies["vue"]}`);
    if (dependencies["next"]) technologies.push(`Next.js ${dependencies["next"]}`);
    if (dependencies["nuxt"]) technologies.push(`Nuxt.js ${dependencies["nuxt"]}`);
    if (dependencies["vite"]) technologies.push(`Vite ${dependencies["vite"]}`);
    if (dependencies["tailwindcss"]) technologies.push("Tailwind CSS");
    if (dependencies["@playwright/test"]) technologies.push("Playwright");
    if (dependencies["vitest"]) technologies.push("Vitest");

    return technologies;
}

// Obtenir les technologies de base de données à partir du contenu des fichiers .env et docker-compose
function getDatabaseTechnologies(envContent, dockerComposeContent) {
    const technologies = [];

    const content = `${envContent ?? ""}\n${dockerComposeContent ?? ""}`.toLowerCase();

    if (content.includes("mysql")) technologies.push("MySQL");
    if (content.includes("postgres") || content.includes("postgresql")) technologies.push("PostgreSQL");
    if (content.includes("sqlite")) technologies.push("SQLite");
    if (content.includes("mongodb")) technologies.push("MongoDB");

    return [...new Set(technologies)];
}

// Obtenir un résumé des routes à partir du contenu des fichiers de routes
function getRouteSummary(routerContent) {
    if (!routerContent) return [];
    return routerContent
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("Route::"))
        .slice(0, 50);
}

// Lire les fichiers de configuration du projet
const packageJson = readJsonFileIfExists(path.join(root, "package.json"));
const composerJson = readJsonFileIfExists(path.join(root, "composer.json"));

// Lire les fichiers d'environnement et de configuration Docker
const envExample = readFileIfExists(path.join(root, ".env.example"));
const dockerCompose = readFileIfExists(path.join(root, "docker-compose.yml"));
const dockerComposeOverride = readFileIfExists(path.join(root, "docker-compose.override.yml"));

// Analyser les variables d'environnement et identifier celles qui sont importantes
const envVariables = getEnvVariables(envExample);
const importantEnvVariables = getImportantEnvVariables(envVariables);

// Construire le contexte du projet avec toutes les informations collectées
const context = {
    project: {
        name:
            packageJson?.name ??
            composerJson?.name ??
            path.basename(root),

        repositoryUrl: getGitRepoUrl(),
    },

    technologies: {
        backend: getBackendTechnologies(composerJson),
        frontend: getFrontendTechnologies(packageJson),
        database: getDatabaseTechnologies(envExample, `${dockerCompose ?? ""}\n${dockerComposeOverride ?? ""}`),
        infrastructure: [
            fileExists(path.join(root, "Dockerfile")) ? "Docker" : null,
            dockerCompose ? "Docker Compose" : null,
        ].filter(Boolean),
        testing: [
            packageJson?.devDependencies?.["@playwright/test"] ? "Playwright" : null,
            packageJson?.devDependencies?.["vitest"] ? "Vitest" : null,
            composerJson?.["require-dev"]?.["pestphp/pest"] ? "Pest" : null,
            composerJson?.["require-dev"]?.["phpunit/phpunit"] ? "PHPUnit" : null,
        ].filter(Boolean),
    },  
    
    structure: {
        tree: getProjectTree(),
    },

    dependencies: {
        composer: composerJson?.require ?? {},
        composerDev: composerJson?.["require-dev"] ?? {},
        npm: packageJson?.dependencies ?? {},
        npmDev: packageJson?.devDependencies ?? {},
    },

    scripts: {
        composer: composerJson?.scripts ?? {},
        npm: packageJson?.scripts ?? {},
    },

    environment: {
        variablesCount: envVariables.length,
        importantVariables: importantEnvVariables,
    },

    docker: {
        enabled:
            fileExists(path.join(root, "Dockerfile")) ||
            fileExists(path.join(root, "docker-compose.yml")),
        files: [
            fileExists(path.join(root, "Dockerfile")) ? "Dockerfile" : null,
            fileExists(path.join(root, "docker-compose.yml")) ? "docker-compose.yml" : null,
            fileExists(path.join(root, "docker-compose.override.yml")) ? "docker-compose.override.yml" : null,
        ].filter(Boolean),
    },

    routes: {
        web: getRouteSummary(readFileIfExists(path.join(root, "routes/web.php"))),
        api: getRouteSummary(readFileIfExists(path.join(root, "routes/api.php"))),
    },

    databaseFiles: {
        migrationsCount: listFilesInDirectory(path.join(root, "database/migrations")).length,
        seedersCount: listFilesInDirectory(path.join(root, "database/seeders")).length,
        factoriesCount: listFilesInDirectory(path.join(root, "database/factories")).length,
    },

    sourceFiles: {
        packageJson: Boolean(packageJson),
        composerJson: Boolean(composerJson),
        envExample: Boolean(envExample),
        dockerCompose: Boolean(dockerCompose),
        dockerComposeOverride: Boolean(dockerComposeOverride),
    }
};

// Créer le répertoire de sortie du fichier JSON si nécessaire
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
// Écrire le contenu de la constante contexte dans le fichier JSON de sortie
fs.writeFileSync(outputPath, JSON.stringify(context, null, 2), "utf-8");

// Afficher un message de réussite dans la console
console.log(`Project context has been analyzed and saved to ${outputPath}`);