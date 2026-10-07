import { StageLinq } from 'stagelinq'

const StageLinqManager = {
  activeDecks: {},

  async init(win) {
    try {
      StageLinq.options = {
        downloadDbSources: true
      }

      // ------------------------------------------------------------
      // Initialer State für ein Deck
      // ------------------------------------------------------------

      const getDeck = (deckNumber) => {
        if (!this.activeDecks[deckNumber]) {
          this.activeDecks[deckNumber] = {
            deck: deckNumber,

            title: null,
            artist: null,

            bpm: null,
            isPlaying: false,

            length: 0,
            elapsed: 0,

            beat: 0,
            totalBeats: 0,
            samples: null
          }
        }

        return this.activeDecks[deckNumber]
      }

      // ------------------------------------------------------------
      // Daten an Renderer senden
      // ------------------------------------------------------------

      const sendDeck = (deckNumber) => {
        if (!win) return
        if (win.isDestroyed()) return
        if (win.webContents.isDestroyed()) return

        const deck = this.activeDecks[deckNumber]

        if (!deck) return

        win.webContents.send('nowPlaying', {
          deck: deckNumber,

          title: deck.title,
          artist: deck.artist,

          bpm: deck.bpm,

          isPlaying: deck.isPlaying,

          elapsed: deck.elapsed,
          length: deck.length,

          beat: deck.beat,
          totalBeats: deck.totalBeats,

          samples: deck.samples
        })
      }

      // ============================================================
      // TRACK LOADED
      // ============================================================

      StageLinq.devices.on('trackLoaded', (status) => {
        console.log('[StageLinq] trackLoaded', status)

        /*
         * status.deck ist laut Library z.B. "1A" oder "2B"
         */

        const match = String(status.deck || '').match(/\d+/)

        if (!match) return

        const deckNumber = Number(match[0])

        if (deckNumber < 1 || deckNumber > 4) return

        const deck = getDeck(deckNumber)

        deck.title = status.title || null
        deck.artist = status.artist || null

        if (Number.isFinite(Number(status.currentBpm))) {
          deck.bpm = Number(status.currentBpm)
        }

        if (Number.isFinite(Number(status.trackLength))) {
          deck.length = Number(status.trackLength)
        }

        deck.isPlaying = Boolean(status.playState)

        // Neuer Track -> Position zurücksetzen
        deck.elapsed = 0
        deck.beat = 0
        deck.totalBeats = 0
        deck.samples = null

        sendDeck(deckNumber)
      })

      // ============================================================
      // NOW PLAYING
      // ============================================================

      StageLinq.devices.on('nowPlaying', (status) => {
        console.log('[StageLinq] nowPlaying', status)

        const match = String(status.deck || '').match(/\d+/)

        if (!match) return

        const deckNumber = Number(match[0])

        if (deckNumber < 1 || deckNumber > 4) return

        const deck = getDeck(deckNumber)

        if (status.title !== undefined) {
          deck.title = status.title
        }

        if (status.artist !== undefined) {
          deck.artist = status.artist
        }

        if (status.currentBpm !== undefined) {
          const bpm = Number(status.currentBpm)

          if (Number.isFinite(bpm) && bpm > 0) {
            deck.bpm = bpm
          }
        }

        if (status.trackLength !== undefined) {
          const length = Number(status.trackLength)

          if (Number.isFinite(length) && length > 0) {
            deck.length = length
          }
        }

        if (status.playState !== undefined) {
          deck.isPlaying = Boolean(status.playState)
        }

        sendDeck(deckNumber)
      })

      // ============================================================
      // BEAT INFO
      //
      // WICHTIG:
      //
      // beatMessage liefert:
      //
      // (connectionInfo, data)
      //
      // data.decks[0] = Deck 1
      // data.decks[1] = Deck 2
      // ...
      //
      // deck.beat = aktuelle Position in Beats
      // deck.bpm  = aktueller BPM
      // deck.samples = Sampleposition
      // ============================================================

      StageLinq.devices.on(
        'beatMessage',
        (_connectionInfo, data) => {
          if (!data || !Array.isArray(data.decks)) {
            return
          }

          data.decks.forEach((beatData, index) => {
            const deckNumber = index + 1

            if (deckNumber > 4) return
            if (!beatData) return

            const deck = getDeck(deckNumber)

            // ------------------------------------------------------
            // LIVE BPM
            // ------------------------------------------------------

            const bpm = Number(beatData.bpm)

            if (
              Number.isFinite(bpm) &&
              bpm > 0 &&
              bpm < 500
            ) {
              deck.bpm = bpm
            }

            // ------------------------------------------------------
            // BEAT POSITION
            // ------------------------------------------------------

            const beat = Number(beatData.beat)

            if (Number.isFinite(beat) && beat >= 0) {
              deck.beat = beat
            }

            // ------------------------------------------------------
            // TOTAL BEATS
            // ------------------------------------------------------

            const totalBeats = Number(beatData.totalBeats)

            if (
              Number.isFinite(totalBeats) &&
              totalBeats > 0
            ) {
              deck.totalBeats = totalBeats
            }

            // ------------------------------------------------------
            // SAMPLE POSITION
            // ------------------------------------------------------

            if (beatData.samples !== undefined) {
              const samples = Number(beatData.samples)

              if (Number.isFinite(samples)) {
                deck.samples = samples
              }
            }

            // ------------------------------------------------------
            // TIMEcode aus Beat + BPM
            //
            // 1 Beat = 60 / BPM Sekunden
            //
            // Beispiel:
            //
            // beat = 32.5
            // bpm  = 128
            //
            // 32.5 * (60 / 128)
            // = 15.234 Sekunden
            // ------------------------------------------------------

            if (
              Number.isFinite(deck.beat) &&
              Number.isFinite(deck.bpm) &&
              deck.bpm > 0
            ) {
              deck.elapsed =
                deck.beat * (60 / deck.bpm)
            }

            sendDeck(deckNumber)
          })
        }
      )

      // ============================================================
      // STATE MAP
      //
      // Zusätzlich CurrentBPM / PlayState usw.
      // ============================================================

      StageLinq.devices.on('stateChanged', (state) => {
        /*
         * Die Library stellt auch direkte Events pro State-Path bereit.
         *
         * Der BeatInfo-Stream ist für BPM/Position wichtiger.
         * StateChanged verwenden wir hauptsächlich für PlayState.
         */

        if (!state) return

        console.log('[StageLinq] stateChanged', state)
      })

      // ============================================================
      // DIREKTE STATE EVENTS
      //
      // Die Library unterstützt z.B.:
      //
      // /Engine/Deck1/Play
      // /Engine/Deck1/PlayState
      // /Engine/Deck1/CurrentBPM
      // ============================================================

      for (let deckNumber = 1; deckNumber <= 4; deckNumber++) {
        const deck = getDeck(deckNumber)

        StageLinq.devices.on(
          `/Engine/Deck${deckNumber}/Play`,
          (value) => {
            deck.isPlaying = Boolean(value)
            sendDeck(deckNumber)
          }
        )

        StageLinq.devices.on(
          `/Engine/Deck${deckNumber}/PlayState`,
          (value) => {
            deck.isPlaying = Boolean(value)
            sendDeck(deckNumber)
          }
        )

        StageLinq.devices.on(
          `/Engine/Deck${deckNumber}/CurrentBPM`,
          (value) => {
            const bpm = Number(value)

            if (
              Number.isFinite(bpm) &&
              bpm > 0 &&
              bpm < 500
            ) {
              deck.bpm = bpm
            }

            sendDeck(deckNumber)
          }
        )
      }

      // ============================================================
      // CONNECT
      // ============================================================

      await StageLinq.connect()

      console.log(
        '[StageLinq] Connected – BeatInfo aktiv'
      )
    } catch (error) {
      console.error(
        '[StageLinq] Connection error:',
        error
      )
    }
  }
}

export default StageLinqManager