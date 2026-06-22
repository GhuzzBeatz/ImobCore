const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) app.quit()

let win = null
let ghzBackend = null

app.on('second-instance', () => {
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
})

function isLicensePageUrl(url) {
  try { return decodeURIComponent(new URL(url).pathname).replace(/\\/g, '/').endsWith('/pages/licenca.html') } catch (e) { return false }
}

function loadLicensePage() {
  if (win && !win.isDestroyed()) win.loadFile('pages/licenca.html').catch(() => {})
}

function createWindow() {
  const dataDir = getDataDir()
  win = new BrowserWindow({
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
      nodeIntegrationInSubFrames: true,
      contextIsolation: false,
      devTools: !app.isPackaged,
      additionalArguments: [`--data-dir=${dataDir}`]
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  })

  win.webContents.on('will-navigate', (event, url) => {
    if (!ghzBackend?.isSessionAuthorized() && !isLicensePageUrl(url)) {
      event.preventDefault()
      loadLicensePage()
    }
  })
}

function getDataDir() {
  const dataDir = path.join(app.getPath('userData'), 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  return dataDir
}

ghzBackend = require('./js/ghz-backend')({
    app, ipcMain, getDataDir,
    appId: 'imobcore',
    manifestUrl: 'https://raw.githubusercontent.com/GhuzzBeatz/ImobCore/master/update-manifest.json'
})

app.whenReady().then(async () => {
  if (!gotSingleInstanceLock) return
  createWindow()
  await win.loadFile('pages/licenca.html')
  const result = await ghzBackend.validateForStartup().catch(() => ({ ok: false }))
  if (result?.ok && win && !win.isDestroyed()) await win.loadFile('index.html')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
