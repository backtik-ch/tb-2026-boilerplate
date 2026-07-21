import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

// Racine du projet
const root = path.resolve(process.cwd());

// Chemins des fichiers utilisés pour la génération du CHANGELOG.
const generatorDirectory = path.join(root, "scripts/changelog-generator");
const promptPath = path.join(generatorDirectory, "prompt.md");
const commitsListPath = path.join(generatorDirectory, "commits-list.json");
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
            `${fileName} est introuvable au chemin : ${filePath}`
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
 * 
 */
function validateCommitsList(content) {
    let commitsList;

    try {
        commitsList = JSON.parse(content);
    } catch {
        throw new Error("La liste de commits est un fichier JSON invalide.");
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
    if (!content || content.trim().length === 0) throw new Error("Le LLM a retourné une release vide.");

    if (/{{[^}]+}}/.test(content)) throw new Error("La release générée contient encore des placeholders.");

    const expectedTitle = `## [${version}]`;

    if (!content.trim().startsWith(expectedTitle)) throw new Error(`La release ne commence pas par ${expectedTitle}.`);

    if (content.includes("# Changelog")) throw new Error ("Le LLM a généré un changelog complet plutôt qu'une release.")
}

/**
 * Génère ou met à jour le contenu de la nouvelle release par LLM.
 * 
 * La fonction extrait les instructions, le template de la RELEASE, la liste de commits du projet. Elle effectue la requête au LLM, valide le résultat puis l'écrit dans le CHANGELOG.md final.
 *
 * @throws {Error} Si la clé API de OpenAI est absente des variables d'environnement.
 */
async function generateRelease() {
    
    console.log("Extraction des instructions…");
    const instructions = readMandatoryFile(
        promptPath,
        "Prompt"
    );

    console.log("Extraction de la liste de commits…");
    const commitsListContent = readMandatoryFile(
        commitsListPath,
        "Liste de commits"
    );
    const commitsList = validateCommitsList(commitsListContent);

    console.log("Extraction du template de release…");
    const releaseTemplate = readMandatoryFile(
        releaseTemplatePath,
        "Template RELEASE"
    );


    console.log("Extraction du CHANGELOG existant…");
    const existingChangelog = readOptionalFile(
        existingChangelogPath
    );

    let changelogTemplate = "";

    if(!existingChangelog) {
        console.log("Extraction du template de CHANGELOG");
        changelogTemplate = readMandatoryFile(
            changelogTemplatePath,
            "CHANGELOG TEMPLATE"
        );
    }

    if (existingChangelog && existingChangelog.includes(`## [${commitsList.version}]`)) throw new Error("Cette version est déjà documentée dans le changelog.")

    if (!process.env.OPENAI_API_KEY) throw new Error("La clé OPENAI est absente des variables d'environnement.");

    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
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

    console.log("Génération de la nouvelle release par LLM…")

    // Envoie les instructions et la liste de commits au LLM.
    const response = await client.responses.create({
        model: process.env.OPENAI_MODEL ?? "gpt-5.2",
        instructions,
        input
    });

    const generatedContent = response.output_text;
    const cleanedContent = cleanMarkdown(generatedContent);
    validateRelease(cleanedContent, commitsList.version);

    // Rédaction du CHANGELOG.md
    let finalChangelog;

    if(existingChangelog) {
        if(!existingChangelog.includes("<!-- RELEASES -->")) {
            throw new Error("Le marqueur <!-- RELEASES --> n'a pas été trouvé dans le changelog.");
        }

        finalChangelog = existingChangelog.replace(
            "<!-- RELEASES -->",
            `<!-- RELEASES -->\n\n${cleanedContent}`
        );
    } else {
        if(!changelogTemplate.includes("{{RELEASES}}")) {
            throw new Error("Le placeholder {{RELEASES}} n'a pas été trouvé dans le template.");
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
        `CHANGELOG.md ${existingChangelog ? "mis à jour" : "généré"} avec succès.`
    );
}

/**
 * Lance la génération du CHANGELOG et intercepte les erreurs.
 * 
 * Si une erreur survient durant la génération, un message d'erreur est affiché dans la console et un code de sortie est indiqué. Le code 1 signale un échec à GitHub Actions.
 */
generateRelease().catch((error) => {
    console.error(`Une erreur est survenue : ${error.message}`);
    process.exit(1);
})