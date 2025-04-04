import { exec } from 'child_process';
import prompts from 'prompts';
import ora from 'ora';
import fs from 'fs';

const red = '\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const reset = '\x1b[0m';

function getPackageName() {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    return packageJson.name;
}

async function getNpmVersion(packageName) {
    try {
        const response = await fetch(`https://registry.npmjs.org/${packageName}`, { method: 'GET' });
        if (response.status !== 200) {
            throw new Error('Failed to fetch version from npm');
        }
        const data = await response.json();
        return data['dist-tags'].latest;
    } catch (error) {
        console.error(`${red}Error fetching version from npm: ${error.message}${reset}`);
        process.exit(1);
    }
}

function getLocalVersion() {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    return packageJson.version;
}

function isGreaterVersion(localVersion, npmVersion) {
    const [localMajor, localMinor, localPatch] = localVersion.split('.').map(Number);
    const [npmMajor, npmMinor, npmPatch] = npmVersion.split('.').map(Number);

    if (localMajor > npmMajor) return true;
    if (localMajor === npmMajor && localMinor > npmMinor) return true;
    if (localMajor === npmMajor && localMinor === npmMinor && localPatch > npmPatch) return true;

    return false;
}

function incrementVersion(currentVersion, bumpType) {
    let [major, minor, patch] = currentVersion.split('.').map(Number);

    if (bumpType === 'patch') {
        patch += 1;
    } else if (bumpType === 'minor') {
        minor += 1;
        patch = 0;
    } else if (bumpType === 'major') {
        major += 1;
        minor = 0;
        patch = 0;
    }

    return `${major}.${minor}.${patch}`;
}

async function bumpVersion(currentVersion) {
    const response = await prompts({
        type: 'select',
        name: 'bump',
        message: 'Select the version bump type:',
        choices: [
            { title: 'Patch (x.y.z => x.y.Z+1)', value: 'patch' },
            { title: 'Minor (x.y.z => x.Y+1.0)', value: 'minor' },
            { title: 'Major (x.y.z => x.X+1.0.0)', value: 'major' }
        ],
        validate: value => value.trim() === '' ? 'Please select a version bump type' : true,
        limit: 1,
        onState: state => {
            state.aborted && console.log(`${yellow}Exiting...${reset}`) && process.exit(0);
        }
    });

    if (!response.bump) {
        console.log(`${yellow}Exiting...${reset}`);
        process.exit(0);
    }
    const newVersion = incrementVersion(currentVersion, response.bump);
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    packageJson.version = newVersion.toString();

    fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
    console.log(`${green}Version bumped to ${packageJson.version}${reset}`);
    return packageJson.version;
}

async function deployToGitHub() {
    exec('git add .', async (error) => {
        if (error) {
            console.error(`${red}Error adding files to git: ${error.message}${reset}`);
            return;
        }

        const response = await prompts({
            type: 'text',
            name: 'commit',
            message: 'Enter the commit message:',
            validate: value => value.trim() === '' ? 'Commit message cannot be empty' : true,
            onState: state => {
                state.aborted && console.log(`${yellow}Exiting...${reset}`) && process.exit(0);
            }
        });

        if (!response.commit) {
            console.log(`${yellow}Exiting...${reset}`);
            process.exit(0);
        }

        exec(`git commit -m "${response.commit}"`, (error) => {
            if (error) {
                console.error(`${red}Error committing files: ${error.message}${reset}`);
                return;
            }

            console.log(`${blue}Pushing to GitHub...${reset}`);

            exec('git push origin main', (error) => {
                if (error) {
                    console.error(`${red}Error pushing to GitHub: ${error.message}${reset}`);
                    return;
                }

                console.log(`${green}Successfully deployed to GitHub!${reset}`);
            });
        });
    });
}

async function main() {
    const packageName = getPackageName();
    const localVersion = getLocalVersion();
    const spinner = ora('Fetching version from npm').start();
    const npmVersion = await getNpmVersion(packageName);
    spinner.stop();

    console.log(`${blue}Local version: ${localVersion}${reset}`);
    console.log(`${blue}NPM version: ${npmVersion}${reset}`);

    if (isGreaterVersion(localVersion, npmVersion)) {
        console.log(`${yellow}✔  Passed. Ready to deploy.${reset}`);
        await deployToGitHub();
    } else {
        console.error(`${red}Local version (${localVersion}) is outdated.${reset}`);
        const newVersion = await bumpVersion(localVersion);
        console.log(`${green}Updated local version to ${newVersion}${reset}`);
        await deployToGitHub();
    }
}

main();