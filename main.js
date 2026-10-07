const { app, BrowserWindow } = require('electron');
const { StageLinq } = require('stagelinq');
const abletonlink = require('abletonlink');

const link = new abletonlink();

link.startUpdate(60, (beat, phase, bpm) => {
    console.log("updated: ", beat, phase, bpm);
    link.bpm = 128;
});

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
}

app.whenReady().then(async () => {
  createWindow();

  try {
    // 1. Optionen statisch auf der Klasse setzen
    StageLinq.options = { downloadDbSources: true };

    // 2. Event-Listener statisch an StageLinq.devices hängen
    StageLinq.devices.on('trackLoaded', (status) => {
      console.log(`Track geladen: ${status.title} - ${status.artist} auf Deck ${status.deck}`);
      if (mainWindow) {
        mainWindow.webContents.send('trackLoaded', status);
      }
    });

    StageLinq.devices.on('nowPlaying', (status) => {
      console.log(`Now Playing: ${status.title} - ${status.artist}`);
      if (mainWindow) {
        mainWindow.webContents.send('nowPlaying', status);
      }
    });

    // 3. Statisch verbinden (ohne 'new')
    await StageLinq.connect();
    console.log('StageLinq erfolgreich im Netzwerk verbunden!');

  } catch (err) {
    console.error('StageLinq Verbindungsfehler:', err);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});