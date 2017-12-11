const electron = require("electron");
const path = require("path");

function grabFile(fileUrl) {
    const visible = !!process.env.SHOW_UTIL;
    const grabberWindow = new electron.BrowserWindow({
        webPreferences: { preload: path.join(__dirname, "utilPreload.js") },
        show: visible,
    });
    const promise = new Promise((resolve) => {
        grabberWindow.webContents.openDevTools();

        electron.ipcMain.on("util-ready", () => {
            grabberWindow.webContents.send("xhrGet", fileUrl);
            electron.ipcMain.once("xhrGet-return", (event, data) => {
                resolve({ data, window: grabberWindow });
            });
        });

        setTimeout(() => grabberWindow.loadURL("https://nerdcubed.co.uk/404"), 500);
    });
    return promise;
}

function padLeft(input, padding, amount) {
    return `${padding.repeat(amount)}${input}`.slice(-amount);
}

function setTimeoutPromise(delay) {
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    });
}

module.exports = {
    grabFile,
    padLeft,
    setTimeoutPromise,
};
