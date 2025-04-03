import path from 'node:path'
import fs from 'fs-extra'
import si from "systeminformation";
import {promises as fsPromises} from "fs";
import type {BrowserWindow} from "electron";
import * as childProcess from 'child_process';
import { platform } from 'os';
import { join } from 'path';
import { app } from 'electron';

let hardwareStatsInterval: NodeJS.Timeout | null = null;

// Define appWorkFolder
const appWorkFolder = path.join(app.getPath('documents'), 'MetaflowOrchesMeister');

export async function copyResourcesOnFirstRun(app: any, appFolderPath: string) {
    // Use a dot prefix for the flag file to make it hidden on Unix-like systems
    const firstRunFlagPath = path.join(appFolderPath, '.first-run-completed');
    console.log(firstRunFlagPath);
    
    if (!fs.existsSync(firstRunFlagPath)) {
        try {
            // For Electron Vite projects
            const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

            let resourcesPath;
            if (isDev) {
                // In development mode
                resourcesPath = path.join(process.cwd(), 'resources');
            } else {
                // In production mode
                resourcesPath = path.join(app.getAppPath(), '../resources');

                // If resources are not found, try alternative locations
                if (!fs.existsSync(resourcesPath)) {
                    resourcesPath = path.join(process.resourcesPath, 'resources');
                }
            }

            console.log('Resource path:', resourcesPath);
            console.log('Target path:', appFolderPath);

            // Ensure the target directory exists
            await fs.ensureDir(appFolderPath);

            // Copy all files and folders to target location
            await fs.copy(resourcesPath, appFolderPath);

            // Create a flag file to indicate first run is completed
            fs.writeFileSync(firstRunFlagPath, 'true');
            
            // Make the file hidden on Windows
            if (platform() === 'win32') {
                try {
                    childProcess.execSync(`attrib +h "${firstRunFlagPath}"`);
                } catch (error) {
                    console.error('Failed to hide file:', error);
                }
            }

            console.log('Resources extracted successfully to:', appFolderPath);
        } catch (err) {
            console.error('Failed to extract resources:', err);
        }
    }
}
export function startHardwareStatsBroadcast(win: BrowserWindow | null) {
    // Start sending hardware stats every second
    hardwareStatsInterval = setInterval(async () => {
        try {
            const stats = await getHardwareStats();
            if (win) {
                win.webContents.send('hardware-stats-update', stats);
            }
        } catch (error) {
            console.error('Error sending hardware stats:', error);
        }
    }, 1000);
}
export function stopStatsBroadcast(){
    if (hardwareStatsInterval) {
        clearInterval(hardwareStatsInterval);
    }
}
export async function getHardwareStats() {
    const cpuLoad = await si.currentLoad();
    const memInfo = await si.mem();
    const gpuInfo = await si.graphics();

    return {
        cpu: {
            usage: cpuLoad.currentLoad,
            cores: cpuLoad.cpus.map(core => core.load)
        },
        ram: {
            total: memInfo.total,
            used: memInfo.used,
            free: memInfo.free,
            usedPercent: (memInfo.used / memInfo.total) * 100
        },
        gpu: gpuInfo.controllers.map(gpu => ({
            name: gpu.model,
            vram: gpu.vram,
            driverVersion: gpu.driverVersion
        }))
    };
}
// Function to create or update docker-compose.yml
export async function createOrUpdateDockerCompose(filePath: string): Promise<void> {
    const yamlContent = `services:
networks:
  metaflow_network:
    external: true
`;
    try {
        await fsPromises.writeFile(filePath, yamlContent, 'utf8');
        console.log(`Ensured docker-compose.yml exists/updated at: ${filePath}`);
    } catch (error) {
        console.log(`Error writing docker-compose.yml: ${error}`, 'error');
        throw error; // Re-throw the error
    }
}
export function createContainerAndFoldersStructure(appFolderPath: string, containerName: string){
    const containerFolderPath = path.join(appFolderPath,'containers', containerName);
    if (!fs.existsSync(containerFolderPath)){
        fs.mkdirSync(containerFolderPath, {recursive: true});
    }   
    const containerFolders = [
        'input',
        'output',
        'custom_nodes',
        'notebooks',
    ]        
    for (const folder of containerFolders){ 
        const folderPath = path.join(containerFolderPath, folder);
        if (!fs.existsSync(folderPath)){
            fs.mkdirSync(folderPath, {recursive: true});
        }
    }       
}
export async function updateDockerComposeFile(containerName: string, port: number, jupyterPort: number, networkName: string) {
    try {
        // Ensure the docker-compose file exists first
        const dockerComposeFilePath = join(appWorkFolder, 'docker-compose.yml');
        const shared_models_dir = join(appWorkFolder, 'shared_models');
        // Read the template file
        const templatePath = join(app.getPath('userData'), 'templates', 'service.template');
        const templateExists = await fs.pathExists(templatePath);
        
        if (!templateExists) {
            // If the template doesn't exist in userData, try resources folder
            const templateResourcePath = join(
                process.env.NODE_ENV === 'development' 
                    ? path.join(process.cwd(), 'resources', 'templates') 
                    : path.join(process.resourcesPath, 'templates'), 
                'service.template'
            );
            
            // Ensure templates directory exists in userData
            await fs.ensureDir(join(app.getPath('userData'), 'templates'));
            
            // Copy template from resources to userData if it exists
            if (await fs.pathExists(templateResourcePath)) {
                await fs.copy(templateResourcePath, templatePath);
            } else {
                throw new Error('Template file not found');
            }
        }
        
        // Now read the template file
        let templateContent = await fs.readFile(templatePath, 'utf-8');
        
        // Replace variables in double brackets
        templateContent = templateContent
            .replace(/\{\{containerName\}\}/g, containerName)
            .replace(/\{\{port\}\}/g, port.toString())
            .replace(/\{\{jupyterPort\}\}/g, jupyterPort.toString())
            .replace(/\{\{shared_models_dir\}\}/g, shared_models_dir)
            .replace(/\{\{networkName\}\}/g, networkName);
        
        // Read existing docker-compose file
        let dockerComposeContent = '';
        if (await fs.pathExists(dockerComposeFilePath)) {
            dockerComposeContent = await fs.readFile(dockerComposeFilePath, 'utf-8');
        } else {
            // If file doesn't exist, create base structure
            dockerComposeContent = `services:
networks:
  ${networkName}:
    external: true
`;
        }
        
        // Check if there's already a service with this name
        const serviceRegex = new RegExp(`^ {2}${containerName}:`, 'm');
        if (serviceRegex.test(dockerComposeContent)) {
            // Replace existing service definition
            dockerComposeContent = dockerComposeContent.replace(
                new RegExp(`^ {2}${containerName}:[\\s\\S]*?(^ {2}\\w|$)`, 'm'),
                (match, nextSection) => {
                    return `${templateContent}${nextSection === '$' ? '' : nextSection}`;
                }
            );
        } else {
            // Add new service - insert after 'services:' line
            dockerComposeContent = dockerComposeContent.replace(
                /^services:$/m,
                `services:
${templateContent}`
            );
        }
        
        // Write updated docker-compose file
        await fs.writeFile(dockerComposeFilePath, dockerComposeContent);
        
        console.log(`Docker compose file updated with ${containerName} service`);
        return dockerComposeFilePath;
    } catch (error) {
        console.error('Error updating docker-compose file:', error);
        throw error;
    }
}
