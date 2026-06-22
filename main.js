const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

function createWindow() {
  const dataDir = getDataDir()
  const win = new BrowserWindow({
    width: 1460,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    autoHideMenuBar: true,
    title: 'ImobCore',
    backgroundColor: '#070d1b',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#070d1b',
      symbolColor: '#f3f7ff',
      height: 32
    },
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      additionalArguments: [`--data-dir=${dataDir}`]
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  })

  win.loadFile('index.html')
}

function getDataDir() {
  const dataDir = path.join(app.getPath('userData'), 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  return dataDir
}

app.whenReady().then(() => {
  require('./js/ghz-backend')({
    app, ipcMain, getDataDir,
    appId: 'imobcore',
    manifestUrl: 'https://raw.githubusercontent.com/GhuzzBeatz/ImobCore/master/update-manifest.json'
  })
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
