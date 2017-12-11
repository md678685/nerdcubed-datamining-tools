const electron = require('electron')
const path = require('path')

const grabFile = fileUrl => {
  let visible = !!process.env.SHOW_UTIL
  let grabberWindow = new electron.BrowserWindow({
    webPreferences: { preload: path.join(__dirname, 'utilPreload.js') },
    show: visible,
  })
  let promise = new Promise(resolve => {
    grabberWindow.webContents.openDevTools()

    electron.ipcMain.on('util-ready', () => {
      grabberWindow.webContents.send('xhrGet', fileUrl)
      electron.ipcMain.once('xhrGet-return', (event, data) => {
        resolve({ data, window: grabberWindow })
      })
    })

    setTimeout(() => grabberWindow.loadURL('https://nerdcubed.co.uk/404'), 500)
  })
  return promise
}

const setTimeoutPromise = delay => new Promise(resolve => {
  setTimeout(resolve, delay)
})

module.exports = { grabFile, setTimeoutPromise }
