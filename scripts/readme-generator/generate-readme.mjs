/**
 * Ce script génère ou met à jour le fichier README.md du projet.
 * 
 * Il utilise :
 * - les instructions définies dans prompt.md ;
 * - la structure définie dans README-template.md ;
 * - le contexte généré par analyze-project.mjs dans project-context.json ;
 * - le README existant, si disponible.
 */

// Importer le module 'fs' pour la manipulation des fichiers
import fs from 'fs';
// Importer le module 'path' pour la manipulation des chemins de fichiers
import path from 'path';
// Importer le SDK de OpenAI
import OpenAI from 'openai';

// Définir le chemin racine du projet
const root = path.resolve(process.cwd());

// Définir les chemins des différents fichiers nécessaires à la génération du README
const generatorDirectory = path.join(root, "scripts/readme-generator");
const promptPath = path.join(generatorDirectory, "prompt.md");
const templatePath = path.join(generatorDirectory, "README-template.md");
const contextPath = path.join(generatorDirectory, "project-context.json");
const readmePath = path.join(root, "README.md");

// Vérifier l'existence d'un fichier
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

// Lire un fichier obligatoire à la génération du README
function readMandatoryFile(filePath, fileName) {
    if(!fileExists(filePath)) {
        throw new Error(
            `${fileName} est introuvable au chemin : ${filePath}`
        );
    }

    return fs.readFileSync(filePath, "utf-8");
}

// Lire un fichier optionnel à la génération du README
function readOptionalFile(filePath) {
    if(!fileExists(filePath)) return "";

    return fs.readFileSync(filePath, "utf-8");
}

// Nettoyer le fichier markdown généré
function cleanMarkdown(content) {
    const trimmedContent = content.trim();

    const markdownBlockPattern = /^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i;

    const match = trimmedContent.match(markdownBlockPattern);

    return match ? match[1].trim() : trimmedContent;
}

// Valider le contenu du fichier généré
function validateReadme(content) {
    if (!content || content.trim().length === 0) throw new Error("Le LLM a retourné un README vide.");

    if (!content.trim().startsWith("# ")) throw new Error("Le README ne commence pas par un titre.");

    if (/{{[^}]+}}/.test(content)) throw new Error("Le README généré contient encore des placeholders.");
}

// Générer le README par LLM
async function generateReadme() {
    
    console.log("Extraction des instructions…");
    const instructions = readMandatoryFile(
        promptPath,
        "Prompt"
    );

    console.log("Extraction du template…");
    const template = readMandatoryFile(
        templatePath,
        "Template README"
    );

    console.log("Extraction du contexte de projet…");
    const projectContext = readMandatoryFile(
        contextPath,
        "Contexte du projet"
    );

    console.log("Extraction du README existant…");
    const existingReadme = readOptionalFile(
        readmePath
    );

    if (!process.env.OPENAI_API_KEY) throw new Error("La clé OPENAI est absente des variables d'environnement.");

    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

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

    console.log("Génération du README par LLM…")

    const response = await client.responses.create({
        model: process.env.OPENAI_MODEL ?? "gpt-5.2",
        instructions,
        input
    });

    const generatedContent = response.output_text;
    const cleanedContent = cleanMarkdown(generatedContent);
    validateReadme(cleanedContent);

    fs.writeFileSync(
        readmePath,
        `${cleanedContent}\n`,
        "utf-8"
    );

    console.log("README.md a été généré.");
}

generateReadme().catch((error) => {
    console.error(`Une erreur est survenue : ${error.message}`);
    process.exit(1);
})