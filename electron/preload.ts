import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    // 窗口事件监听（用于修复图表渲染问题）
    onFocus: (callback: () => void) => {
      ipcRenderer.on('window:focus', callback)
      return () => ipcRenderer.removeListener('window:focus', callback)
    },
    onShow: (callback: () => void) => {
      ipcRenderer.on('window:show', callback)
      return () => ipcRenderer.removeListener('window:show', callback)
    },
    onRestore: (callback: () => void) => {
      ipcRenderer.on('window:restore', callback)
      return () => ipcRenderer.removeListener('window:restore', callback)
    }
  },
  platform: process.platform
})
