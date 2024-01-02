import inquirer from "inquirer";
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

// Function to prompt user for project details
async function getProjectDetails() {
    const questions = [
        {
            type: 'input',
            name: 'projectName',
            message: 'Enter your project name:',
            validate: input => input ? true : 'Project name cannot be empty.'
        },
        {
            type: 'input',
            name: 'stagingUrl',
            message: 'Enter your staging URL:'
        },
        {
            type: 'input',
            name: 'productionUrl',
            message: 'Enter your production URL:'
        }
    ];
    
    return inquirer.prompt(questions);
}

// Function to create project structure
function createProjectStructure(projectName, stagingUrl, productionUrl) {
    const config = { projectName, stagingUrl, productionUrl, 'debug':true, 'minify': true};
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
    console.log('Project structure created and configuration saved.');
}

// Function to generate and display share links
function generateAndDisplayShareLinks(projectName) {
    const jsdelivrBaseUrl = `https://cdn.jsdelivr.net/gh/${process.env.GITHUB_ORG}/${projectName}@latest/dist/`;
    const prodHeaderJsUrl = jsdelivrBaseUrl + 'header-prod.js'; // Change 'prod.js' to your actual production JS file name
    const prodFooterJsUrl = jsdelivrBaseUrl + 'footer-prod.js'; // Change 'prod.js' to your actual production JS file name
    const stagingHeaderJsUrl = jsdelivrBaseUrl + 'header-staging.js'; // Change 'staging.js' to your actual staging JS file name
    const stagingFooterJsUrl = jsdelivrBaseUrl + 'footer-staging.js'; // Change 'staging.js' to your actual staging JS file name
    const cssFileUrl = jsdelivrBaseUrl + 'style.min.css'; // Change 'style.min.css' to your actual CSS file name

    const embedHeaderCode = `
<!-- Production JS -->
<script src="${prodHeaderJsUrl}"></script>

<!-- Staging JS -->
<script src="${stagingHeaderJsUrl}"></script>

<!-- CSS File -->
<link rel="stylesheet" href="${cssFileUrl}">
`;
    const embedFooterCode = `
<!-- Production JS -->
<script src="${prodFooterJsUrl}"></script>

<!-- Staging JS -->
<script src="${stagingFooterJsUrl}"></script>
`;

    console.log('Share links:');
    console.log('Production Header JS File URL:', prodHeaderJsUrl);
    console.log('Production Footer JS File URL:', prodFooterJsUrl);
    console.log('Staging Header JS File URL:', stagingHeaderJsUrl);
    console.log('Staging Footer JS File URL:', stagingFooterJsUrl);
    console.log('CSS File URL:', cssFileUrl);

    fs.writeFileSync('./embed-header.txt', embedHeaderCode);
    fs.writeFileSync('./embed-footer.txt', embedFooterCode);
    console.log('Embed code saved to embed.txt');
}

// Main function to run the script
async function main() {
    try {
        const { projectName, stagingUrl, productionUrl } = await getProjectDetails();

        // Create project structure
        createProjectStructure(projectName, stagingUrl, productionUrl);

        // Generate and display share links
        generateAndDisplayShareLinks(projectName);

        console.log('Setup complete.');
    } catch (error) {
        console.error('Error during setup:', error);
    }
}

main();
