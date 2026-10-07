import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// 1. Manager-Module importieren (ESM / CommonJS)
import AbletonLinkManager from './abletonLinkManager'
import StageLinqManager from './stageLinqManager'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, // Etwas breiter für die 4 Decks
    height: 700,
    show: false,
    focusable: true,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.showInactive()
  })

  // Initialdaten senden, sobald der Renderer fertig geladen hat
  mainWindow.webContents.on('did-finish-load', () => {
    if (AbletonLinkManager.syncInitialData) {
      AbletonLinkManager.syncInitialData(mainWindow)
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  // 2. Manager mit dem erstellten Fenster initialisieren
  AbletonLinkManager.init(mainWindow)
  StageLinqManager.init(mainWindow).catch((err) => {
    console.error('StageLinq Verbindungsfehler:', err)
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})