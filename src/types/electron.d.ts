export interface ElectronAPI {
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
    onFocus: (callback: () => void) => () => void
    onShow: (callback: () => void) => () => void
    onRestore: (callback: () => void) => () => void
  }
  platform: NodeJS.Platform
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
