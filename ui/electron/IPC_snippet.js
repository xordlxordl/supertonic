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
