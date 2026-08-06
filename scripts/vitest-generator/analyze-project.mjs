import fs from "fs";
import path from "path";
import { execSync } from "child_process";

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
 * Récupère les fichier frontend – .ts, .js, .vue modifiés par rapport à la branche main.
 * 
 * @param {*} directoryPath 
 * @returns {Array} Liste des fichiers avec le chemin + leur contenu.
 */
function getFrontendFiles() {

    const editedFiles = execSync('git diff --name-only origin/main...HEAD', { encoding: 'utf-8' }).trim().split('\n');

    const frontendFiles = [];

    for (const file of editedFiles) {

        if(
            (
                file.startsWith('resources/js/Components') || file.startsWith('resources/js/composables/')
            ) &&
            (
                file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.vue')
            )
        ){
            const filePath = path.join(root, file);

            if(fileExists(filePath)) {
                const fileName = path.basename(file, path.extname(file));

                const testExtension = file.endsWith('.ts') || fs.readFileSync(filePath, "utf-8").includes('lang="ts"') ? '.test.ts' : '.test.js';

                const testPath = path.join(root, 'tests/Unit/vitest', `${fileName}${testExtension}`);

                frontendFiles.push({
                    path: file,
                    content: fs.readFileSync(filePath, "utf-8"),
                    test: fileExists(testPath) ? {
                        path: path.relative(root, testPath),
                        content: fs.readFileSync(testPath, "utf-8")
                    } : null
                })
            }   
        }
    }

    return frontendFiles;
}

const context = {
    packageJson: readJsonFileIfExists(path.join(root, "package.json")),
    
    viteConfig: readFileIfExists(path.join(root, "vite.config.ts")) || readFileIfExists(path.join(root, "vite.config.js")),

    typeScriptConfig: readJsonFileIfExists(path.join(root, "tsconfig.json")),

    frontendFiles: getFrontendFiles()
}

// Création du dossier de sortie et du fichier de contexte JSON.
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(context, null, 2), "utf-8");

// Affichage du message de réussite dans la console.
console.log(`Vitest context has been analyzed and saved to ${outputPath}`);