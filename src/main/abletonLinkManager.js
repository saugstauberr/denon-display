import AbletonLink from 'abletonlink'

const AbletonLinkManager = {
  link: null,

  init(win) {
    this.link = new AbletonLink()

    this.link.on('tempo', (bpm) => {
      console.log('[Ableton Link] BPM:', bpm)

      if (win && !win.isDestroyed()) {
        win.webContents.send('link-bpm', bpm)
      }
    })

    this.link.on('numPeers', (numPeers) => {
      console.log('[Ableton Link] Peers:', numPeers)

      if (win && !win.isDestroyed()) {
        win.webContents.send('link-peers', numPeers)
      }
    })

    console.log('[Ableton Link] Manager initialisiert')
  },

  syncInitialData(win) {
    if (!this.link || !win || win.isDestroyed()) {
      return
    }

    if (typeof this.link.bpm === 'number') {
      win.webContents.send(
        'link-bpm',
        this.link.bpm
      )
    }

    if (typeof this.link.numPeers === 'number') {
      win.webContents.send(
        'link-peers',
        this.link.numPeers
      )
    } else {
      win.webContents.send(
        'link-peers',
        0
      )
    }
  }
}

export default AbletonLinkManager