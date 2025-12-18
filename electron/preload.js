"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// 暴露安全的API给渲染进程
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    window: {
        minimize: () => electron_1.ipcRenderer.invoke('window:minimize'),
        maximize: () => electron_1.ipcRenderer.invoke('window:maximize'),
        close: () => electron_1.ipcRenderer.invoke('window:close'),
        isMaximized: () => electron_1.ipcRenderer.invoke('window:isMaximized'),
        // 窗口事件监听（用于修复图表渲染问题）
        onFocus: (callback) => {
            electron_1.ipcRenderer.on('window:focus', callback);
            return () => electron_1.ipcRenderer.removeListener('window:focus', callback);
        },
        onShow: (callback) => {
            electron_1.ipcRenderer.on('window:show', callback);
            return () => electron_1.ipcRenderer.removeListener('window:show', callback);
        },
        onRestore: (callback) => {
            electron_1.ipcRenderer.on('window:restore', callback);
            return () => electron_1.ipcRenderer.removeListener('window:restore', callback);
        }
    },
    platform: process.platform
});
