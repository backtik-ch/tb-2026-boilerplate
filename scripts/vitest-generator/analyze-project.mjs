import fs from "fs";
import path from "path";

// Racine du projet
const root = path.resolve(process.cwd());

// Chemin de sortie du fichier de contexte généré.
const outputPath = path.join(root, "scripts/vitest-generator/vitest-context.json");

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
 * Récupère les fichier frontend – .ts, .js, .vue.
 * Fonction récursive pour récupèrer les fichiers des sous-dossiers.
 * 
 * @param {*} directoryPath 
 * @returns {Array} Liste des fichiers avec le chemin + leur contenu.
 */
function getFrontendFiles(directoryPath) {

    if(!fileExists(directoryPath)) {
        return [];
    }

    const ignoredFiles = [
        "app.ts",
        "app.js",
        "bootstrap.ts",
        "bootstrap.js",
        "theme.ts",
        "theme.js",
        "ziggy.js",   
    ];

    const includedDirectories = [
        "Components",
        "Composables",
    ]

    const files = [];

    const items = fs.readdirSync(directoryPath, { withFileTypes: true });

    for (const item of items) {
        
        const itemPath = path.join(directoryPath, item.name);

        if (item.isDirectory()) {
            
            if(includedDirectories.includes(item.name)) {
                files.push(...getFrontendFiles(itemPath));
            } 
        }

        if (!item.isDirectory() && ((item.name.endsWith(".ts") || item.name.endsWith(".js") || item.name.endsWith(".vue")))) {
            
            if(!ignoredFiles.includes(item.name)) {
                files.push({
                    path: path.relative(root, itemPath),
                    code: fs.readFileSync(itemPath, "utf-8")
                });
            }
        }
    }

    return files;
}

const context = {
    packageJson: readJsonFileIfExists(path.join(root, "package.json")),
    
    viteConfig: readFileIfExists(path.join(root, "vite.config.ts")),

    typeScriptConfig: readJsonFileIfExists(path.join(root, "tsconfig.json")),

    frontendFiles: getFrontendFiles(path.join(root, "resources/js"))
}

// Création du dossier de sortie et du fichier de contexte JSON.
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(context, null, 2), "utf-8");

// Affichage du message de réussite dans la console.
console.log(`Vitest context has been analyzed and saved to ${outputPath}`);