const { contextBridge, ipcRenderer } = require("electron");

/**
 * Functions that should be available in the render process.
 */
contextBridge.exposeInMainWorld("recorder", {
    showSelectSources: () => ipcRenderer.send("show-select-sources"),
    onSelectSource: (callback) => ipcRenderer.on("select-source", callback),
    streamChunkReceived: (chunk) => ipcRenderer.send("stream-chunk-received", chunk),
    showSelectFile: (chunks) => ipcRenderer.send("show-select-file", chunks),
});