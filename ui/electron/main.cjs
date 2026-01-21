const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

// Path definitions based on environment
let BINARY_PATH;
let WORKING_DIR;

if (app.isPackaged) {
    // In production, resources are at .../resources/rust
    WORKING_DIR = path.join(process.resourcesPath, 'rust');
    BINARY_PATH = path.join(WORKING_DIR, 'example_onnx.exe');
} else {
    // In dev
    WORKING_DIR = path.resolve(__dirname, '../../rust');
    BINARY_PATH = path.resolve(__dirname, '../../rust/target/release/example_onnx.exe');
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false // Allow loading local files (WAVs)
        },
        backgroundColor: '#09090b', // zinc-950
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#09090b',
            symbolColor: '#ffffff',
            height: 32
        }
    });

    const startUrl = app.isPackaged
        ? `file://${path.join(__dirname, '../dist/index.html')}`
        : 'http://localhost:5173';

    mainWindow.loadURL(startUrl);

    if (!app.isPackaged) {
        // mainWindow.webContents.openDevTools();
    }
}

// Disable GPU Acceleration to fix crashes on some Windows systems
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-rasterization');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('--no-sandbox');

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handler for TTS Generation
ipcMain.handle('generate-tts', async (event, { text, voice, lang, speed, steps }) => {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const outputFilename = `output_${timestamp}.wav`;
        const outputPath = path.join(os.tmpdir(), outputFilename);

        console.log('Generating TTS...', { text, voice, lang, speed, steps, outputPath });

        // Construct arguments
        // example_onnx.exe --output <FILE> --text <TEXT> --voice-style <VOICE> --lang <LANG> --speed <SPEED>
        // Note: The binary usage might differ slightly based on CLI help.
        // Based on previous help output: 
        // --save-dir <SAVE_DIR> [default: results]
        // And it seems it generates files named based on input or sequence?
        // Let's check CLI help again.
        // Help says: --save-dir <SAVE_DIR> Output directory [default: results]
        // It doesn't explicitly offer a filename override per request in the help snippet I saw.
        // However, usually these tools output a predictable filename.
        // If I cannot control filename, I will use a dedicated temp dir for this request to find the file.

        // Strategy: Use a unique temp directory for this generation to isolate the output file.
        const uniqueDir = path.join(os.tmpdir(), `supertonic_${timestamp}`);
        if (!fs.existsSync(uniqueDir)) fs.mkdirSync(uniqueDir);

        const fullVoicePath = path.join('assets', 'voice_styles', `${voice}.json`);

        const args = [
            '--save-dir', uniqueDir,
            '--text', text,
            '--voice-style', fullVoicePath,
            '--lang', lang,
            '--speed', speed.toString(),
            '--total-step', (steps || 5).toString()
        ];

        console.log(`Spawning: ${BINARY_PATH} with args:`, args);
        console.log(`CWD: ${WORKING_DIR}`);

        const child = spawn(BINARY_PATH, args, {
            cwd: WORKING_DIR // Important so it finds assets/onnx via default relative paths
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
            console.log('STDOUT:', data.toString());
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
            console.error('STDERR:', data.toString());
        });

        child.on('close', (code) => {
            if (code !== 0) {
                console.error(`Process exited with code ${code}`);
                reject({ message: `Process exited with code ${code}`, stderr });
                return;
            }

            // Find the generated WAV file in the directory
            try {
                const files = fs.readdirSync(uniqueDir);
                const wavFile = files.find(f => f.endsWith('.wav'));

                if (wavFile) {
                    const fullPath = path.join(uniqueDir, wavFile);
                    resolve({ filePath: fullPath, stdout });
                } else {
                    reject({ message: "No WAV file generated", stdout, stderr });
                }
            } catch (err) {
                reject({ message: "Error reading output directory", error: err });
            }
        });

        child.on('error', (err) => {
            console.error('Failed to start subprocess:', err);
            reject(err);
        });
    });
});
const { dialog } = require('electron');

// IPC Handler for Saving Audio
ipcMain.handle('save-audio', async (event, sourcePath) => {
    // Only allow saving if the source path exists
    if (!fs.existsSync(sourcePath)) {
        return { success: false, error: 'Source file not found' };
    }

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Audio File',
        defaultPath: 'supertonic_output.wav',
        filters: [
            { name: 'WAV Audio', extensions: ['wav'] }
        ]
    });

    if (filePath) {
        try {
            fs.copyFileSync(sourcePath, filePath);
            return { success: true, filePath };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    return { success: false, canceled: true };
});
