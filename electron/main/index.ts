import {app, BrowserWindow, shell, ipcMain, dialog} from 'electron'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import path from 'node:path'
import os from 'node:os'
import {update} from './update'
import {join} from 'path'
import {existsSync, readdirSync, statSync, readFileSync} from 'fs'
import {spawn} from 'child_process'
import { exec } from 'child_process';
import { promisify } from 'util';

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

    // Auto update
    update(win)
}

app.whenReady().then(() => {
    createWindow()

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

    ipcMain.handle("api:runComfyUI", async (_, arg: string) => {
        try {
            const mainPyPath = join(arg, 'main.py');

            // Check if main.py exists in the specified path
            if (!existsSync(mainPyPath)) {
                throw new Error(`main.py not found in path: ${arg}`);
            }

            // Try with embedded Python first
            const possibleEmbeddedPaths = [
                join(path.dirname(arg), 'python_embeded', 'python.exe'),
                join(path.dirname(arg), 'python_embedded', 'python.exe')
            ];

            let embeddedPythonPath = '';
            for (const path of possibleEmbeddedPaths) {
                if (existsSync(path)) {
                    embeddedPythonPath = path;
                    sendLog(`Found embedded Python at: ${path}`);
                    break;
                }
            }

            if (embeddedPythonPath) {
                sendLog('Using embedded Python...');
                const embeddedProcess = spawn(embeddedPythonPath, ['-s', 'main.py', '--listen'], {
                    cwd: arg,
                    stdio: 'pipe',
                    shell: process.platform === 'win32'
                });

                embeddedProcess.stdout.on('data', (data) => {
                    sendLog(`ComfyUI (embedded) stdout: ${data}`);
                });

                embeddedProcess.stderr.on('data', (data) => {
                    sendLog(`ComfyUI (embedded): ${data}`, 'error');
                });

                embeddedProcess.on('close', (code) => {
                    if (code !== 0) {
                        sendLog(`ComfyUI (embedded) process exited with code ${code}`, 'error');
                    }
                });

                return {success: true, pid: embeddedProcess.pid, usingEmbedded: true};
            }

            // If embedded Python not found, try system Python
            sendLog('Embedded Python not found, trying system Python...');
            const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
            const pythonPath = await new Promise<string>((resolve, reject) => {
                const checkPython = spawn('where', [pythonCommand], {
                    stdio: 'pipe',
                    shell: true
                });

                let output = '';
                checkPython.stdout.on('data', (data) => {
                    output += data.toString();
                });

                checkPython.on('close', (code) => {
                    if (code === 0 && output.trim()) {
                        resolve(output.trim().split('\n')[0]);
                    } else {
                        reject(new Error(`Python not found in PATH. Command: ${pythonCommand}`));
                    }
                });
            });

            sendLog(`Using system Python at: ${pythonPath}`);

            // Try running with system Python
            const pythonProcess = spawn(pythonPath, ['main.py', '--listen'], {
                cwd: arg,
                stdio: 'pipe',
                shell: process.platform === 'win32'
            });

            // Handle process output
            pythonProcess.stdout.on('data', (data) => {
                sendLog(`ComfyUI stdout: ${data}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                const errorStr = data.toString();
                sendLog(`ComfyUI stderr: ${errorStr}`, 'error');

                // Check for PyTorch-related errors
                if (errorStr.includes('torch') || errorStr.includes('PyTorch')) {
                    sendLog('PyTorch error detected, trying embedded Python again...');
                    // Try one more time with embedded Python
                    if (existsSync(embeddedPythonPath)) {
                        sendLog('Found embedded Python, trying to use it...');
                        const embeddedProcess = spawn(embeddedPythonPath, ['-s', 'main.py', '--listen'], {
                            cwd: arg,
                            stdio: 'pipe',
                            shell: process.platform === 'win32'
                        });

                        embeddedProcess.stdout.on('data', (data) => {
                            sendLog(`ComfyUI (embedded) stdout: ${data}`);
                        });

                        embeddedProcess.stderr.on('data', (data) => {
                            sendLog(`ComfyUI (embedded) stderr: ${data}`, 'error');
                        });

                        embeddedProcess.on('close', (code) => {
                            if (code !== 0) {
                                sendLog(`ComfyUI (embedded) process exited with code ${code}`, 'error');
                            }
                        });

                        return {success: true, pid: embeddedProcess.pid, usingEmbedded: true};
                    }
                }
            });

            // Handle process exit
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    sendLog(`ComfyUI process exited with code ${code}`, 'error');
                    if (code === 9009) {
                        sendLog('Python is not found in PATH. Please ensure Python is installed and added to PATH.', 'error');
                    }
                }
            });

            return {success: true, pid: pythonProcess.pid, usingEmbedded: false};
        } catch (error) {
            sendLog(`Failed to start ComfyUI: ${error}`, 'error');
            throw error;
        }
    });

    const execAsync = promisify(exec);

    async function isPortInUse(port: number): Promise<boolean> {
        try {
            if (process.platform === 'win32') {
                const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
                return stdout.length > 0;
            } else {
                const { stdout } = await execAsync(`lsof -i :${port}`);
                return stdout.length > 0;
            }
        } catch (error) {
            return false; // If command fails, assume port is not in use
        }
    }

    async function findPythonProcess(scriptPath: string): Promise<number | null> {
        try {
            if (process.platform === 'win32') {
                const { stdout } = await execAsync('wmic process where caption="python.exe" get commandline,processid');
                const lines = stdout.split('\n');
                for (const line of lines) {
                    if (line.includes('main.py') && line.includes(scriptPath)) {
                        const pid = line.match(/(\d+)\s*$/)?.[1];
                        return pid ? parseInt(pid) : null;
                    }
                }
            } else {
                const { stdout } = await execAsync(`ps aux | grep python | grep "${scriptPath}/main.py"`);
                const pid = stdout.split(/\s+/)[1];
                return pid ? parseInt(pid) : null;
            }
        } catch (error) {
            return null;
        }
        return null;
    }

    async function killProcess(pid: number): Promise<boolean> {
        try {
            if (process.platform === 'win32') {
                await execAsync(`taskkill /PID ${pid} /F`);
            } else {
                await execAsync(`kill -9 ${pid}`);
            }
            return true;
        } catch (error) {
            console.error('Error killing process:', error);
            return false;
        }
    }

    ipcMain.handle('api:stopComfyUI', async (_, arg: { path: string; port: string }) => {
        try {
            const port = parseInt(arg.port || '8188');
            let success = false;

            // First try to find and kill by port
            if (await isPortInUse(port)) {
                sendLog(`Port ${port} is in use, attempting to free it...`);
                if (process.platform === 'win32') {
                    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
                    const pid = stdout.match(/(\d+)\s*$/)?.[1];
                    if (pid) {
                        success = await killProcess(parseInt(pid));
                        if (success) {
                            sendLog(`Successfully stopped process using port ${port}`, 'success');
                        }
                    }
                } else {
                    const { stdout } = await execAsync(`lsof -i :${port} -t`);
                    const pid = parseInt(stdout.trim());
                    if (pid) {
                        success = await killProcess(pid);
                        if (success) {
                            sendLog(`Successfully stopped process using port ${port}`, 'success');
                        }
                    }
                }
            }

            // If port-based kill didn't work or port wasn't in use, try finding by script path
            if (!success) {
                sendLog('Attempting to find ComfyUI process by script path...');
                const pid = await findPythonProcess(arg.path);
                if (pid) {
                    success = await killProcess(pid);
                    if (success) {
                        sendLog(`Successfully stopped ComfyUI process (PID: ${pid})`, 'success');
                    }
                }
            }

            if (!success) {
                sendLog('No running ComfyUI process found', 'error');
            }

            return { success };
        } catch (error) {
            sendLog(`Error stopping ComfyUI: ${error}`, 'error');
            throw error;
        }
    });

    ipcMain.handle('api:getLastImage', async (_, arg) => {
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
        console.log(imageFiles)
        const sortedFiles = imageFiles.sort((a, b) => b.creationTime - a.creationTime);

        return sortedFiles.length > 0 ? sortedFiles[0] : undefined;

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

