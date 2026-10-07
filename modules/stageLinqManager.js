const { StageLinq } = require('stagelinq');

const StageLinqManager = {
  async init(win) {
    try {
      StageLinq.options = { downloadDbSources: true };

      const sendTrackInfo = (status) => {
        if (win && !win.webContents.isLoading()) {
          win.webContents.send('nowPlaying', {
            title: status.title || 'Unbekannt',
            artist: status.artist || 'Unbekannt',
            deck: status.deck || 1
          });
        }
      };

      StageLinq.devices.on('trackLoaded', (status) => {
        console.log('Track Geladen Event:', status);
        sendTrackInfo(status);
      });

      StageLinq.devices.on('nowPlaying', (status) => {
        console.log('Now Playing Event:', status);
        sendTrackInfo(status);
      });

      await StageLinq.connect();
      console.log('StageLinq Modul erfolgreich verbunden!');
    } catch (err) {
      console.error('StageLinq Fehler:', err);
    }
  }
};

module.exports = StageLinqManager;