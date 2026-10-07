const { app, BrowserWindow } = require('electron');
const AbletonLinkManager = require('./modules/abletonLinkManager');
const StageLinqManager = require('./modules/stageLinqManager');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.webContents.on('did-finish-load', () => {
    // Initialen Link-Status an die UI senden
    AbletonLinkManager.syncInitialData(mainWindow);
  });
}

app.whenReady().then(async () => {
  createWindow();

  // Module wie "Namespaces" initialisieren
  AbletonLinkManager.init(mainWindow);
  await StageLinqManager.init(mainWindow);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});