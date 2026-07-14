import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Racine du projet
const root = path.resolve(process.cwd());

// Chemin de sortie du fichier de contexte généré.
const outputPath = path.join(root, "scripts/readme-generator/project-context.json");

/**
 * Vérifie si un fichier ou un répertoire existe.
 * 
 * @param {string} filePath Chemin du fichier à vérifier.
 * @returns {boolean} true si le fichier existe, sinon false.
 */
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

/**
 * Lit le contenu d'un fichier s'il existe.
 * 
 * @param {string} filePath Chemin du fichier à vérifier.
 * @returns {string|null} Contenu du fichier s'il existe, sinon null.
 */
function readFileIfExists(filePath) {
    return fileExists(filePath) ? fs.readFileSync(filePath, "utf-8") : null;
}

/**
 * Lit le contenu d'un fichier et vérifie qu'il s'agisse de JSON.
 * 
 * @param {string} filePath Chemin du fichier à lire.
 * @returns {Object|null} Objet JSON si le fichier existe et est valide, sinon null.
 */
function readJsonFileIfExists(filePath) {
    const content = readFileIfExists(filePath);
    if(content === null) return null;
    try{
        return JSON.parse(content);
    } catch {
        return null;
    }
}

/**
 * Liste les fichiers présents dans un répertoire.
 * 
 * @param {string} directoryPath Chemin du répertoire à lire.
 * @returns {string[]} Liste des chemins des fichiers présents dans le répertoire.
 */
function listFilesInDirectory(directoryPath) {
    if (!fileExists(directoryPath)) return [];
    return fs.readdirSync(directoryPath).map(file => path.relative(root, path.join(directoryPath, file)));
}

/**
 * Retourne l'URL du dépôt distant Git.
 * 
 * @returns {string|null} L'URL du dépôt distant si trouvable, sinon null.
 */
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

/**
 * Génère une représentation en arbre (texte) de l'arborescence du projet.
 * 
 * @param {string} directoryPath Chemin du répertoire à parcourir.
 * @param {number} currentDepth Niveau actuel de la récursion.
 * @param {number} maxDepth Niveau maximum de la récursion.
 * @param {string} prefix Préfixe utilisé pour rédiger l'arborescence ("└── " ; "├──" ; "│").
 * @returns {string[]} Liste des lignes de la représentation en arbre.
 */
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

/**
 * Extrait les variables d'environnement du fichier .env.
 * 
 * Ignore les lignes vides et les commentaires.
 * Ne retourne que les noms de variables, sans leur valeur.
 * 
 * @param {string} envContent Contenu du fichier .env.
 * @returns {string[]} Liste des noms des variables d'environnement.
 */
function getEnvVariables(envContent) {
    if (!envContent) return [];

    return envContent
        .split("\n")
        .filter((line) => line.trim() && !line.trim().startsWith("#"))
        .map((line) => line.split("=")[0].trim())
        .filter(Boolean);
}

/**
 * Filtre les variables d'environnement considérées comme importantes.
 * 
 * @param {string[]} envVariables Liste des noms des variables d'environnement.
 * @returns {string[]} Liste des noms de variables d'environnement importantes.
 */
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

/**
 * Récupère les technologies de base de données détectées dans le projet.
 * 
 * @param {string} envContent Contenu du fichier .env.
 * @param {string} dockerComposeContent Contenu du fichier Docker Compose.
 * @returns {string[]} Liste des SGBD détectés.
 */
function getDatabaseTechnologies(envContent, dockerComposeContent) {
    const technologies = [];

    const content = `${envContent ?? ""}\n${dockerComposeContent ?? ""}`.toLowerCase();

    if (content.includes("mysql")) technologies.push("MySQL");
    if (content.includes("postgres") || content.includes("postgresql")) technologies.push("PostgreSQL");
    if (content.includes("sqlite")) technologies.push("SQLite");
    if (content.includes("mongodb")) technologies.push("MongoDB");

    return [...new Set(technologies)];
}

/**
 * Effectue un résumé des routes définies dans les fichiers de routes backend.
 * 
 * @param {string} routerContent Contenu d'un fichier de routes
 * @returns {string[]} Liste résumée des routes trouvées.
 */
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

// Lecture des fichiers de configuration du projet.
const packageJson = readJsonFileIfExists(path.join(root, "package.json"));
const composerJson = readJsonFileIfExists(path.join(root, "composer.json"));
const envExample = readFileIfExists(path.join(root, ".env.example"));
const dockerCompose = readFileIfExists(path.join(root, "docker-compose.yml"));
const dockerComposeOverride = readFileIfExists(path.join(root, "docker-compose.override.yml"));

const envVariables = getEnvVariables(envExample);
const importantEnvVariables = getImportantEnvVariables(envVariables);

// Construction du contexte de projet ensuite fourni au générateur de README (par LLM).
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

// Création du dossier de sortie et du fichier de contexte JSON.
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(context, null, 2), "utf-8");

// Affichage du message de réussite dans la console.
console.log(`Project context has been analyzed and saved to ${outputPath}`);