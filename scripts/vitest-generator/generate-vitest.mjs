import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

// Racine du projet
const root = path.resolve(process.cwd());

// Chemins des fichiers utilisés pour la génération des tests.
const generatorDirectory = path.join(root, "scripts/vitest-generator");
const promptPath = path.join(generatorDirectory, "prompt.md");
const contextPath = path.join(generatorDirectory, "vitest-context.json");

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
 * Vérifie qu'un fichier obligatoire à la génération par LLM soit existant et le lit.
 * 
 * @param {string} filePath Chemin du fichier à vérifier.
 * @param {string} fileName Nom du fichier à vérifier.
 * @returns {string} Contenu du fichier au format UTF-8.
 * @throws {Error} Si le fichier est inexistant ou introuvable au chemin indiqué.
 */
function readMandatoryFile(filePath, fileName) {
    if(!fileExists(filePath)) {
        throw new Error(
            `${fileName} could not be found at: ${filePath}`
        );
    }

    return fs.readFileSync(filePath, "utf-8");
}

/**
 * Nettoie le contenu retourné par le LLM.
 * 
 * @param {string} content Contenu retourné par le LLM.
 * @returns {string} Contenu nettoyé.
 */
function cleanJSON(content) {
    const trimmedContent = content.trim();

    const cleanedContent = trimmedContent
        .replace(/^\s*```json\s*/, '')
        .replace(/\s*```\s*$/, '');

    const parsedContent = JSON.parse(cleanedContent);
    
    return parsedContent;
}

/**
 * Écrit les fichiers de tests générés dans le projet.
 * Les répertoires manquants sont automatiquement créés.
 *
 * @param {{path: string, content: string}[]} tests Fichiers de tests générés
 * par le LLM.
 */
function writeTestsFiles(tests) {
    for (const test of tests) {
        const testFilePath = path.join(root, test.path);

        fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
        fs.writeFileSync(testFilePath, test.content, "utf-8");

        console.log(`Test file saved to: ${testFilePath}`);
    }
}

/**
 * Génère les tests unitaires Vitest à l'aide d'un LLM.
 * La fonction extrait les instructions et le contexte du projet, transmet ces éléments au LLM, puis écrit les fichiers de tests retournés.
 *
 * @throws {Error} Si un fichier obligatoire est absent, si la clé API OpenAI
 * n'est pas définie ou si la réponse du LLM est invalide.
 */
async function generateVitest() {

    console.log("Loading instructions...");
    const instructions = readMandatoryFile(
        promptPath,
        "Prompt"
    );
    
    console.log("Loading project context...");
    const projectContext = readMandatoryFile(
        contextPath,
        "Contexte du projet"
    );

    if (!process.env.OPENAI_API_KEY) throw new Error("The OPENAI_API_KEY environment variable is missing.");

    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    // Construction du message contenant le contexte du projet.
    const input = `
        # Contexte du projet :
        <vitest-context>
        ${projectContext}
        </vitest-context>

        Génère maintenant les tests Vitest.
    `;

    console.log("Generating Vitest tests with the LLM...");

    // Envoie les instructions et le contexte au LLM.
    const response = await client.responses.create({
        model: process.env.OPENAI_MODEL ?? "gpt-5.2",
        instructions,
        input
    });

    const generatedContent = cleanJSON(response.output_text);

    writeTestsFiles(generatedContent.files);

    // Affichage du message de réussite dans la console.
    console.log(
        `${generatedContent.files.length} test file(s) successfully generated.`
    );
}

/**
 * Lance la génération des tests et intercepte les erreurs.
 * 
 * Si une erreur survient durant la génération, un message d'erreur est affiché dans la console et un code de sortie est indiqué. Le code 1 signale un échec à GitHub Actions.
 */
generateVitest().catch((error) => {
    console.error(`An error occurred: ${error.message}`);
    process.exit(1);
})