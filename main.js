const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

function ensureDataDir() {
  const dataDir = path.join(app.getPath('userData'), 'data')
  fs.mkdirSync(dataDir, { recursive: true })
  return dataDir
}

function createWindow() {
  const dataDir = ensureDataDir()
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

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
