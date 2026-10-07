import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  onLinkBpm: (callback) => ipcRenderer.on('link-bpm', (_event, value) => callback(value)),
  onLinkPeers: (callback) => ipcRenderer.on('link-peers', (_event, value) => callback(value)),
  onNowPlaying: (callback) => ipcRenderer.on('nowPlaying', (_event, value) => callback(value))
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}