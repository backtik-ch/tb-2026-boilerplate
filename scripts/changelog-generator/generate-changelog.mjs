import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

// Racine du projet
const root = path.resolve(process.cwd());

// Chemins des fichiers utilisés pour la génération du CHANGELOG.
const generatorDirectory = path.join(root, "scripts/changelog-generator");
const promptPath = path.join(generatorDirectory, "prompt.md");
const commitsListPath = path.join(generatorDirectory, "commits-list.json");
const releaseNotesPath = path.join(generatorDirectory, `release-notes.md`);
const releaseTemplatePath = path.join(generatorDirectory, "RELEASE-template.md")
const changelogTemplatePath = path.join(generatorDirectory, "CHANGELOG-template.md");
const existingChangelogPath = path.join(root, "CHANGELOG.md");

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
 * Vérifie la structure et le contenu de la liste de commits.
 * 
 * @param {string} content Contenu JSON de la liste de commits.
 * @return @returns {{version: string, commits: Array}} Liste de commits validée.
 */
function validateCommitsList(content) {
    let commitsList;

    try {
        commitsList = JSON.parse(content);
    } catch {
        throw new Error("The commits list contains is an invalid JSON file.");
    }

    if (typeof commitsList.version !== "string" || commitsList.version.trim().length === 0) throw new Error("La liste de commits ne contient pas une version valide.");
    if (!Array.isArray(commitsList.commits)) throw new Error("La liste de commits est invalide.");
    
    return commitsList;
}

/**
 * Vérifie que le contenu généré par le LLM respecte certaines contraintes.
 * 
 * Le contenu ne doit pas être vide et ne plus contenir de placeholders.
 * 
 * @param {string} content Contenu généré par LLM à vérifier.
 * @throws {Error} Si le contenu est vide ou qu'il contient un ou plusieurs placeholders.
 */
function validateRelease (content, version) {
    if (!content || content.trim().length === 0) throw new Error("The LLM returned an empty release.");

    if (/{{[^}]+}}/.test(content)) throw new Error("The generated release still contains placeholders.");

    const expectedTitle = `## [${version}]`;

    if (!content.trim().startsWith(expectedTitle)) throw new Error(`The generated release does not start with ${expectedTitle}.`);

    if (content.includes("# Changelog")) throw new Error ("The LLM generated a complete changelog instead of a single release.")
}

/**
 * Génère ou met à jour le contenu de la nouvelle release par LLM.
 * 
 * La fonction extrait les instructions, le template de la RELEASE, la liste de commits du projet. Elle effectue la requête au LLM, valide le résultat puis l'écrit dans le CHANGELOG.md final.
 *
 * @throws {Error} Si la clé API de OpenAI est absente des variables d'environnement.
 */
async function generateRelease() {
    
    console.log("Loading instructions...");
    const instructions = readMandatoryFile(
        promptPath,
        "Prompt"
    );

    console.log("Loading commits list...");
    const commitsListContent = readMandatoryFile(
        commitsListPath,
        "Liste de commits"
    );
    const commitsList = validateCommitsList(commitsListContent);

    console.log("Loading release template...");
    const releaseTemplate = readMandatoryFile(
        releaseTemplatePath,
        "Template RELEASE"
    );


    console.log("Loading existing changelog...");
    const existingChangelog = readOptionalFile(
        existingChangelogPath
    );

    let changelogTemplate = "";

    if(!existingChangelog) {
        console.log("Loading changelog template...");
        changelogTemplate = readMandatoryFile(
            changelogTemplatePath,
            "CHANGELOG TEMPLATE"
        );
    }

    if (existingChangelog && existingChangelog.includes(`## [${commitsList.version}]`)) throw new Error(`Version ${commitsList.version} is already documented in the changelog.`)

    if (!process.env.BP_OPENAI_API_KEY) throw new Error("The BP_OPENAI_API_KEY environment variable is missing.");

    const client = new OpenAI({
        apiKey: process.env.BP_OPENAI_API_KEY
    });

    // Construction du message contenant le template et la liste de commits.
    const input = `
        # Template RELEASE :
        <release-template>
        ${releaseTemplate}
        </release-template>

        # Liste de commits et version:
        <commits-list>
        ${JSON.stringify(commitsList, null, 2)}
        </commits-list>

        Génère maintenant la nouvelle release en suivant les instructions.
    `;

    console.log("Generating release with the LLM...")

    // Envoie les instructions et la liste de commits au LLM.
    const response = await client.responses.create({
        model: process.env.BP_OPENAI_MODEL ?? "gpt-5.2",
        instructions,
        input
    });

    const generatedContent = response.output_text;
    const cleanedContent = cleanMarkdown(generatedContent);
    validateRelease(cleanedContent, commitsList.version);

    // Écrit le contenu de la release dans un fichier séparé pour la Release Note
    fs.writeFileSync(
        releaseNotesPath,
        cleanedContent,
        "utf-8"
    );

    // Rédaction du CHANGELOG.md
    let finalChangelog;

    if(existingChangelog) {
        if(!existingChangelog.includes("<!-- RELEASES -->")) {
            throw new Error("The <!-- RELEASES --> marker could not be found in the changelog.");
        }

        finalChangelog = existingChangelog.replace(
            "<!-- RELEASES -->",
            `<!-- RELEASES -->\n\n${cleanedContent}`
        );
    } else {
        if(!changelogTemplate.includes("{{RELEASES}}")) {
            throw new Error("The {{RELEASES}} placeholder could not be found in the changelog template.");
        }

        finalChangelog = changelogTemplate.replace(
            "{{RELEASES}}",
            cleanedContent
        );
    }

    // Écrit le contenu validé dans le fichier CHANGELOG.md.
    fs.writeFileSync(
        existingChangelogPath,
        finalChangelog,
        "utf-8"
    );

    // Affichage du message de réussite dans la console.
    console.log(
        `CHANGELOG.md successfully ${existingChangelog ? "updated" : "generated"}.`
    );
}

/**
 * Lance la génération du CHANGELOG et intercepte les erreurs.
 * 
 * Si une erreur survient durant la génération, un message d'erreur est affiché dans la console et un code de sortie est indiqué. Le code 1 signale un échec à GitHub Actions.
 */
generateRelease().catch((error) => {
    console.error(`An error occurred: ${error.message}`);
    process.exit(1);
})
