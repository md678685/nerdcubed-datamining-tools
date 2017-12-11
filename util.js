const electron = require("electron");
const fs = require("fs");
const path = require("path");
const tmp = require("tmp");

function grabFile(fileUrl) {
    let visible = ( process.env.SHOW_UTIL ? true : false );
    let grabberWindow = new electron.BrowserWindow({
        webPreferences: { preload: path.join(__dirname, "utilPreload.js") },
        show: visible
    });
    let promise = new Promise((resolve, reject) => {
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

function setTimeoutPromise(delay) {
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    })
}

module.exports = { grabFile, setTimeoutPromise };
