import { StoreApi, UseBoundStore } from 'zustand'
import type { ElectronSyncOptions } from './middleware'

type State = Record<string | number | symbol, any>

export function getSerializableState(excludes: string[], state: unknown) {
  return JSON.parse(
    JSON.stringify(state, (key, value) => {
      if (typeof value === 'function' || excludes.includes(key)) {
        return ''
      }
      return value
    })
  )
}

function receiveStateFromMain<T extends State>(store: StoreApi<T>, options: ElectronSyncOptions) {
  if (typeof window !== 'undefined') {
    window.electron.on('zustand-sync-renderer', ({ key, state }: { key: string; state: any }) => {
      if (key === options.key) {
        store.setState(state)
      }
    })
  }
}

function sendStateToMain<T>(excludes: string[], get: () => T, key: string) {
  try {
    const rawState = getSerializableState(excludes, get())

    window.electron.send('zustand-sync', {
      key,
      state: rawState
    })
  } catch (error) {
    console.error(error)
  }
}

function sendStateToRenderer<T>(excludes: string[], get: () => T, key: string) {
  try {
    const rawState = getSerializableState(excludes, get())
    // eslint-disable-next-line global-require
    const { BrowserWindow } = require('electron')
    BrowserWindow.getAllWindows().forEach((win: any) => {
      if (win.webContents) {
        win.webContents.send('zustand-sync-renderer', {
          key,
          state: rawState
        })
      }
    })
  } catch (error) {
    console.error(error)
  }
}

// @ts-ignore
function receiveStateFromRenderer(store: UseBoundStore<StoreApi<unknown>>) {
  if (typeof window !== 'undefined') throw new Error('This function is for main process only')

  // eslint-disable-next-line global-require
  const { ipcMain } = require('electron')

  // const listeners = ipcMain.listenerCount('zustand-sync');
  // if (listeners !== 0) return;

  ipcMain?.on('zustand-sync', (_: any, args: any) => {
    const { state, key } = args[0]
    if (store.key === key) {
      store.setState(state)
    }
  })
}

export { receiveStateFromMain, receiveStateFromRenderer, sendStateToMain, sendStateToRenderer }
