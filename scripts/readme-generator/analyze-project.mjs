/**
 * Ce script analyse le projet (structure, techologies, dépendances, variables d'environnement, etc.) et génère un fichier JSON de contexte du projet.
 */

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
function getProjectTree(directoryPath = root, currentDepth = 0, maxDepth = 1, prefix = "") {
    if (currentDepth > maxDepth) return [];

    const ignoredDirs = new Set([
        "node_modules",
        "vendor",
        ".git",
        "storage",
        "public",
        "dist",
        "build",
        ".DS_Store",
        ".vscode",
        ".gemini",
        ".claude",
        ".playwright",
        ".playwright-mcp",
        ".playwright-report",
        ".env"
    ]);

    const items = fs.readdirSync(directoryPath, { withFileTypes: true });
    
    const importantItems = items.filter((item) => {
        const itemPath = path
            .relative(root, path.join(directoryPath, item.name))
            .replaceAll("\\", "/");

        return (
            !ignoredDirs.has(item.name) &&
            !ignoredDirs.has(itemPath)
        );
    })
    .sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
    });

    const lines = [];

    importantItems.forEach((item, index) => {
        const isLast = index === importantItems.length - 1;
        const branch = isLast ? "└── " : "├── ";
        const itemPath = path.join(directoryPath, item.name);

        lines.push(
            `${prefix}${branch}${item.name}${item.isDirectory() ? "/" : ""}`
        );

        if (item.isDirectory() && currentDepth < maxDepth) {
            const newPrefix = `${prefix}${isLast ? "    " : "│   "}`;

            lines.push(
                ...getProjectTree(
                    itemPath,
                    currentDepth + 1,
                    maxDepth,
                    newPrefix
                )
            )
        };
    })

    return lines;
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

    const maxLength = 10;
    
    const routes = routerContent
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("Route::"))

    const summary = routes.slice(0, maxLength);

    if (routes.length > maxLength) {
        summary.push("…");
    }

    return summary;
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
        database: getDatabaseTechnologies(
            envExample,
            `${dockerCompose ?? ""}\n${dockerComposeOverride ?? ""}`
        ),
        infrastructure: [
            fileExists(path.join(root, "Dockerfile")) ? "Docker" : null,
            dockerCompose ? "Docker Compose" : null,
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