const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    generateTTS: (params) => ipcRenderer.invoke('generate-tts', params),
    saveAudio: (filePath) => ipcRenderer.invoke('save-audio', filePath)
});
