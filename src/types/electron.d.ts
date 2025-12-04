export interface ElectronAPI {
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
  }
  platform: NodeJS.Platform
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
