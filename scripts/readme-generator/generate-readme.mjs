import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

// Racine du projet
const root = path.resolve(process.cwd());

// Chemins des fichiers utilisés pour la génération du README.
const generatorDirectory = path.join(root, "scripts/readme-generator");
const promptPath = path.join(generatorDirectory, "prompt.md");
const templatePath = path.join(generatorDirectory, "README-template.md");
const contextPath = path.join(generatorDirectory, "project-context.json");
const readmePath = path.join(root, "README.md");

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
            `${fileName} could not be found at : ${filePath}`
        );
    }

    return fs.readFileSync(filePath, "utf-8");
}

/**
 * Lit un fichier optionnel à la génération par LLM.
 * 
 * @param {string} filePath Chemin du fichier à lire.
 * @returns {string} Contenu du fichier au format UTF-8.
 */
function readOptionalFile(filePath) {
    if(!fileExists(filePath)) return "";

    return fs.readFileSync(filePath, "utf-8");
}

/**
 * Nettoie le contenu Markdown retourné par le LLM.
 * 
 * @param {string} content Contenu Markdown retourné par le LLM.
 * @returns {string} Contenu Markdown nettoyé.
 */
function cleanMarkdown(content) {
    const trimmedContent = content.trim();

    const markdownBlockPattern = /^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i;

    const match = trimmedContent.match(markdownBlockPattern);

    return match ? match[1].trim() : trimmedContent;
}

/**
 * Vérifie que le contenu généré par le LLM respecte certaines contraintes.
 * 
 * Le contenu ne doit pas être vide, il doit commencer par un titre de 1e niveau et ne plus contenir de placeholders.
 * 
 * @param {string} content Contenu généré par LLM à vérifier.
 * @throws {Error} Si le contenu est vide, ne commence pas par un titre ou qu'il contient un ou plusieurs placeholders.
 */
function validateReadme(content) {
    if (!content || content.trim().length === 0) throw new Error("The LLM returned an empty README.");

    if (!content.trim().startsWith("# ")) throw new Error("The generated README does not start with a level-one heading.");

    if (/{{[^}]+}}/.test(content)) throw new Error("The generated README still contains placeholders.");
}

/**
 * Génère ou met à jour le contenu du README du projet par LLM.
 * 
 * La fonction extrait les instructions, le template du README, le contexte du projet et le README existant. Elle effectue la requête au LLM, valide le résultat puis l'écrit dans le README.md final.
 *
 * @throws {Error} Si la clé API de OpenAI est absente des variables d'environnement.
 */
async function generateReadme() {
    
    console.log("Loading instructions...");
    const instructions = readMandatoryFile(
        promptPath,
        "Prompt"
    );

    console.log("Loading README template...");
    const template = readMandatoryFile(
        templatePath,
        "Template README"
    );

    console.log("Loading project context...");
    const projectContext = readMandatoryFile(
        contextPath,
        "Contexte du projet"
    );

    console.log("Loading existing README...");
    const existingReadme = readOptionalFile(
        readmePath
    );

    if (!process.env.BP_OPENAI_API_KEY) throw new Error("The BP_OPENAI_API_KEY environment variable is missing.");

    const client = new OpenAI({
        apiKey: process.env.BP_OPENAI_API_KEY
    });

    // Construction du message contenant le template, le contexte du projet et l'éventuel README existant.
    const input = `
        # Template README :
        <readme-template>
        ${template}
        </readme-template>

        # Contexte du projet :
        <project-context>
        ${projectContext}
        </project-context>

        ${existingReadme
            ? `# README existant :
            <existing-readme>
            ${existingReadme}
            </existing-readme>`
            : "Aucun README existant disponible."
        }

        Génère maintenant le README final en suivant les instructions.
    `;

    console.log("Generating README with the LLM...");

    // Envoie les instructions et le contexte au LLM.
    const response = await client.responses.create({
        model: process.env.BP_OPENAI_MODEL ?? "gpt-5.2",
        instructions,
        input
    });

    const generatedContent = response.output_text;
    const cleanedContent = cleanMarkdown(generatedContent);
    validateReadme(cleanedContent);

    // Écrit le contenu validé dans le fichier README.md.
    fs.writeFileSync(
        readmePath,
        `${cleanedContent}\n`,
        "utf-8"
    );

    // Affichage du message de réussite dans la console.
    console.log(
        `README.md sucessfully ${existingReadme ? "updated" : "generated"}.`
    );
}

/**
 * Lance la génération du README et intercepte les erreurs.
 * 
 * Si une erreur survient durant la génération, un message d'erreur est affiché dans la console et un code de sortie est indiqué. Le code 1 signale un échec à GitHub Actions.
 */
generateReadme().catch((error) => {
    console.error(`An error occurred: ${error.message}`);
    process.exit(1);
})
