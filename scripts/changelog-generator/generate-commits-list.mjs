import fs from 'fs';
import path from 'path';
import { execSync } from "child_process";

// Racine du projet.
const root = path.resolve(process.cwd());

// Chemin de sortie du fichier de contexte généré.
const outputPath = path.join(root, "scripts/changelog-generator/commits-list.json");

// Le tag actuel fourni par le workflow
// BP_CURRENT_TAG est défini dans le workflow 'release-generate-changelog.yml'.
const currentTag = process.env.BP_CURRENT_TAG;
if (!currentTag) throw new Error("The BP_CURRENT_TAG environment variable is missing.")

// Tous les tags du projet, triés du plus récent au plus ancien.
const allTags = execSync(
    "git tag --sort=-version:refname",
    {
        encoding: "utf-8"
    }
).trim().split("\n");

const currentIndex = allTags.indexOf(currentTag);
if (currentIndex === -1) throw new Error(`Le tag ${currentTag} could not be found.`);

// Le tag précédent
const previousTag = allTags[currentIndex + 1];

// Le spectre duquel il faut récupérer les commits
const versionsRange = previousTag
    ? `${previousTag}..${currentTag}`
    : currentTag;

// Récupère les commits entre deux tags
// %h = hash abbrégé du commit
// %x09 = tabulation
// %s = message du commit
// %an = auteur du commit
// %ai = date du commit au format ISO
const rawCommits = execSync(
    `git log ${versionsRange} --pretty=format:${"%h" + "%x09" + "%s" + "%x09" + "%an" + "%x09" + "%ai"}`,
    {
        encoding: "utf-8"
    }
);

const cleanedCommits = rawCommits
    .split("\n")
    .map((line) => {
        const elements = line.split("\t");

        const hash = elements[0];
        const message = elements[1];
        const author = elements[2];
        const date = elements[3]

        return {
            hash,
            message,
            author,
            date
        };
    });

// Création de la liste au format JSON
const commitsList = {
    version: currentTag.replace("v", ""),
    date: new Date().toISOString().slice(0, 10),
    commits: cleanedCommits
};

fs.writeFileSync(outputPath, JSON.stringify(commitsList, null, 2), "utf-8");

// Affichage du message de réussite dans la console.
console.log(`Commits list has been saved to ${outputPath}`);
