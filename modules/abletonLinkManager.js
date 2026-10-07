const AbletonLink = require('abletonlink');

const AbletonLinkManager = {
  link: null,

  init(win) {
    this.link = new AbletonLink();

    this.link.on('tempo', (bpm) => {
      if (win && !win.webContents.isLoading()) {
        win.webContents.send('link-bpm', bpm);
      }
    });

    this.link.on('numPeers', (numPeers) => {
      if (win && !win.webContents.isLoading()) {
        win.webContents.send('link-peers', numPeers);
      }
    });

    console.log('Ableton Link Modul initialisiert.');
  },

  syncInitialData(win) {
    if (this.link && this.link.bpm && win) {
      win.webContents.send('link-bpm', this.link.bpm);
      win.webContents.send('link-peers', this.link.numPeers || 0);
    }
  }
};

module.exports = AbletonLinkManager;