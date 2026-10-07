document.addEventListener('DOMContentLoaded', () => {
  if (!window.api) return

  function formatTime(seconds) {
    seconds = Number(seconds)

    if (!Number.isFinite(seconds) || seconds < 0) {
      return '00:00.00'
    }

    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)

    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
  }

  window.api.onLinkBpm((bpm) => {
    const bpmEl = document.getElementById('link-bpm')

    if (!bpmEl) return

    const value = Number(bpm)

    if (Number.isFinite(value)) {
      bpmEl.innerText = value.toFixed(2)
    }
  })

  window.api.onLinkPeers((peers) => {
    const peersEl = document.getElementById('link-peers')

    if (!peersEl) return

    peersEl.innerText = String(peers)
  })

  window.api.onNowPlaying((data) => {
    const deck = Number(data.deck)

    if (!Number.isInteger(deck) || deck < 1 || deck > 4) {
      return
    }

    const titleEl = document.getElementById(`deck${deck}-title`)
    const artistEl = document.getElementById(`deck${deck}-artist`)
    const bpmEl = document.getElementById(`deck${deck}-bpm`)
    const elapsedEl = document.getElementById(`deck${deck}-elapsed`)
    const lengthEl = document.getElementById(`deck${deck}-length`)
    const statusEl = document.getElementById(`deck${deck}-status`)

    // ------------------------------------------------------------
    // Titel
    // ------------------------------------------------------------

    if (titleEl) {
      titleEl.innerText = data.title || 'No Track'
      titleEl.className =
        'font-bold text-base text-white truncate leading-tight'
    }

    // ------------------------------------------------------------
    // Artist
    // ------------------------------------------------------------

    if (artistEl) {
      artistEl.innerText = data.artist || '—'
      artistEl.className =
        'text-xs text-zinc-400 truncate'
    }

    // ------------------------------------------------------------
    // BPM
    // ------------------------------------------------------------

    if (bpmEl) {
      const bpm = Number(data.bpm)

      if (Number.isFinite(bpm) && bpm > 0) {
        bpmEl.innerText = bpm.toFixed(2)
      } else {
        bpmEl.innerText = '--.--'
      }

      bpmEl.className =
        'font-mono text-2xl font-black text-white leading-none'
    }

    // ------------------------------------------------------------
    // Zeit
    // ------------------------------------------------------------

    if (elapsedEl) {
      elapsedEl.innerText = formatTime(data.elapsed)

      elapsedEl.className = data.isPlaying
        ? 'text-lg font-bold text-emerald-400 leading-none font-mono'
        : 'text-lg font-bold text-amber-400 leading-none font-mono'
    }

    // ------------------------------------------------------------
    // Gesamtlänge
    // ------------------------------------------------------------

    if (lengthEl) {
      if (Number(data.length) > 0) {
        lengthEl.innerText =
          `/ ${formatTime(data.length)}`
      } else {
        lengthEl.innerText = '/ --:--.--'
      }
    }

    // ------------------------------------------------------------
    // Status
    // ------------------------------------------------------------

    if (statusEl) {
      if (!data.title && !data.artist) {
        statusEl.innerText = 'EMPTY'

        statusEl.className =
          'text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 uppercase tracking-wider'

      } else if (data.isPlaying) {
        statusEl.innerText = 'PLAYING'

        statusEl.className =
          'text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 uppercase tracking-wider animate-pulse'

      } else {
        statusEl.innerText = 'STOPPED'

        statusEl.className =
          'text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase tracking-wider'
      }
    }
  })
})