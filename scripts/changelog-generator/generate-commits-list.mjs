import fs from 'fs';
import path from 'path';
import { execSync } from "child_process";

// Racine du projet.
const root = path.resolve(process.cwd());

// Chemin de sortie du fichier de contexte généré.
const outputPath = path.join(root, "scripts/changelog-generator/commits-list.json");

// Le tag actuel fourni par le workflow
const currentTag = process.env.CURRENT_TAG;
if (!currentTag) throw new Error("La variable d'environnement CURRENT_TAG n'a pas été trouvée.")

// Tous les tags du projet, triés du plus récent au plus ancien.
const allTags = execSync(
    "git tag --sort=-version:refname",
    {
        encoding: "utf-8"
    }
).trim().split("\n");

const currentIndex = allTags.indexOf(currentTag);
if (currentIndex === -1) throw new Error(`Le tag ${currentTag} n'a pas été trouvé.`);

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
const rawCommits = execSync(
    `git log ${versionsRange} --pretty=format:${"%h" + "%x09" + "%s" + "%x09" + "%an"}`,
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

        return {
            hash,
            message,
            author
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