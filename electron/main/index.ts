import {app, BrowserWindow, shell, ipcMain, dialog} from 'electron'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import path from 'node:path'
import os from 'node:os'
import {update} from './update'
import {join} from 'path'
import {existsSync, readdirSync, statSync, readFileSync, mkdirSync, PathLike, promises as fsPromises} from 'fs'
import si from 'systeminformation';
import {
    copyResourcesOnFirstRun,
    createContainerAndFoldersStructure,
    createOrUpdateDockerCompose,
    startHardwareStatsBroadcast,
    stopStatsBroadcast,
    updateDockerComposeFile
} from "./utils";

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, 'public')
    : RENDERER_DIST


// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')
const appWorkDirectory = path.join(os.homedir(), 'Documents', 'MetaflowOrchesMeister');
const baseDockerComposeFile = join(appWorkDirectory, 'docker-compose.yml');

function sendLog(message: string, type: 'info' | 'error' | 'success' = 'info') {
    if (win) {
        win.webContents.send('log-message', {
            timestamp: new Date().toLocaleTimeString(),
            message,
            type
        });
    }
}

async function createWindow() {
    win = new BrowserWindow({
        title: 'Main window',
        icon: process.env.VITE_PUBLIC ? path.join(process.env.VITE_PUBLIC, 'favicon.ico') : undefined,
        width: 1280,
        height: 768,
        webPreferences: {
            preload,
            // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
            // nodeIntegration: true,

            // Consider using contextBridge.exposeInMainWorld
            // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
            // contextIsolation: false,
        },
    })
    win.setMenu(null)
    if (VITE_DEV_SERVER_URL) { // #298
        win.loadURL(VITE_DEV_SERVER_URL)
        // Open devTool if the app is not packaged
        win.webContents.openDevTools()
    } else {
        win.loadFile(indexHtml)
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString())
    })

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({url}) => {
        if (url.startsWith('https:')) shell.openExternal(url)
        return {action: 'deny'}
    })

    function ensureDirectoryExists(directoryPath: PathLike) {
        if (!existsSync(directoryPath)) {
            mkdirSync(directoryPath, { recursive: true });
        }
    }
    // Ensure the directory exists BEFORE trying to write the file
    ensureDirectoryExists(appWorkDirectory);
    await createOrUpdateDockerCompose(baseDockerComposeFile)
    await copyResourcesOnFirstRun(app, appWorkDirectory)
    // Auto update
    update(win)
}



app.whenReady().then(() => {
    createWindow()
    startHardwareStatsBroadcast(win)

    // Handle directory selection dialog
    ipcMain.handle("api:openDirectory", async () => {
        if (win) {
            const {canceled, filePaths} = await dialog.showOpenDialog(win, {
                properties: ["openDirectory"],
                title: "Select ComfyUI Directory"
            });
            if (canceled) {
                return null;
            } else {
                return filePaths[0];
            }
        }
        return null;
    });

    ipcMain.handle('api:createContainerAndFoldersStructure', async (_, arg:{containerName: string, port: number, jupyterPort: number, networkName: string}) => {
        try {
            // Ensure base directory exists
            const containerDir = path.join(appWorkDirectory,'containers', arg.containerName);
            await fsPromises.mkdir(containerDir, { recursive: true });
            
            // Create required subdirectories
            const subdirs = ['output', 'custom_nodes', 'input', 'notebooks'];
            for (const dir of subdirs) {
                await fsPromises.mkdir(path.join(containerDir, dir), { recursive: true });
            }
            
            // Get templates directory path
            const templatesDir = process.env.NODE_ENV === 'development' 
                ? path.join(process.cwd(), 'resources', 'templates') 
                : path.join(process.resourcesPath, 'templates');
            
            // Copy startup template to the container folder
            const startupTemplatePath = path.join(templatesDir, 'startup.template');
            
            if (existsSync(startupTemplatePath)) {
                const startupContent = await fsPromises.readFile(startupTemplatePath, 'utf8');
                await fsPromises.writeFile(path.join(containerDir, 'startup.sh'), startupContent, {
                    mode: 0o755 // Make file executable
                });
                sendLog(`Created startup.sh for ${arg.containerName}`);
            } else {
                sendLog(`Warning: startup.template not found at ${startupTemplatePath}`, 'error');
            }
            
            // Copy Dockerfile template to the container folder
            const dockerfileTemplatePath = path.join(templatesDir, "ComfyUI-docker-templates", 'dockerfile.template');
            
            if (existsSync(dockerfileTemplatePath)) {
                const dockerfileContent = await fsPromises.readFile(dockerfileTemplatePath, 'utf8');
                await fsPromises.writeFile(path.join(containerDir, 'Dockerfile'), dockerfileContent);
                sendLog(`Created Dockerfile for ${arg.containerName}`);
            } else {
                sendLog(`Warning: dockerfile.template not found at ${dockerfileTemplatePath}`, 'error');
            }
            
            // Update docker-compose file
            await updateDockerComposeFile(arg.containerName, arg.port, arg.jupyterPort, arg.networkName);
            
            sendLog(`Container structure created for ${arg.containerName}`);
            return { success: true, path: containerDir };
        } catch (error) {
            sendLog(`Error creating container structure: ${error}`, 'error');
            return { success: false, error: String(error) };
        }
    });
    ipcMain.handle('api:removeContainer', async (_, arg:{containerName: string}) => {
        try {
            const containerDir = path.join(appWorkDirectory, 'containers', arg.containerName);
            await fsPromises.rm(containerDir, { recursive: true, force: true });
            sendLog(`Removed container ${arg.containerName}`);
            return { success: true };
        } catch (error) {
            sendLog(`Error removing container: ${error}`, 'error');
            return { success: false, error: String(error) };
        }
    })
    ipcMain.handle('api:getGeneratedImages', async (_, arg) => {
        const imagesPath = join(arg, 'output')

        const files = readdirSync(imagesPath);

        const imageFiles = files
            .map(file => {
                const filePath = join(imagesPath, file);
                const stats = statSync(filePath);
                const base64 = readFileSync(filePath).toString('base64')
                return {
                    name: file,
                    data: `data:image/png;base64,${base64}`,
                    creationTime: stats.birthtime.getTime()
                };
            });

        const sortedFiles = imageFiles.sort((a, b) => b.creationTime - a.creationTime);

        return sortedFiles.length > 0 ? sortedFiles : undefined;

    })
    ipcMain.handle('api:getHardwareStatistics', async () => {
        try {
            // Get CPU usage
            const cpuLoad = await si.currentLoad();
            const cpuUsage = cpuLoad.currentLoad;

            // Get memory usage
            const memInfo = await si.mem();
            const ramUsage = {
                total: memInfo.total,
                used: memInfo.used,
                free: memInfo.free,
                usedPercent: (memInfo.used / memInfo.total) * 100
            };

            // Get GPU information
            const gpuInfo = await si.graphics();
            const gpuUsage = gpuInfo.controllers.map(gpu => ({
                name: gpu.model,
                vram: gpu.vram,
                driverVersion: gpu.driverVersion
            }));

            return {
                cpu: {
                    usage: cpuUsage,
                    cores: cpuLoad.cpus.map(core => core.load)
                },
                ram: ramUsage,
                gpu: gpuUsage
            };
        } catch (error) {
            console.error('Error getting hardware statistics:', error);
            throw error;
        }
    })

    ipcMain.handle('api:createBaseDockerComposeFile', async () => {
        try {
            await createOrUpdateDockerCompose(baseDockerComposeFile);
            return baseDockerComposeFile;
        } catch (error) {
            // Error is already logged in createOrUpdateDockerCompose
            // Optionally, you could return null or a specific error indicator here
            return null; 
        }
    })

    app.on('window-all-closed', () => {
        win = null
        if (process.platform !== 'darwin') app.quit()
    })

    app.on('second-instance', () => {
        if (win) {
            // Focus on the main window if the user tried to open another
            if (win.isMinimized()) win.restore()
            win.focus()
        }
    })

    app.on('activate', () => {
        const allWindows = BrowserWindow.getAllWindows()
        if (allWindows.length) {
            allWindows[0].focus()
        } else {
            createWindow()
        }
    })

// New window example arg: new windows url
    ipcMain.handle('open-win', (_, arg) => {
        const childWindow = new BrowserWindow({
            webPreferences: {
                preload,
                nodeIntegration: true,
                contextIsolation: false,
            },
        })

        if (VITE_DEV_SERVER_URL) {
            childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
        } else {
            childWindow.loadFile(indexHtml, {hash: arg})
        }
    })
})

// Clean up interval when app is quitting
app.on('before-quit', () => {
   stopStatsBroadcast()
});

