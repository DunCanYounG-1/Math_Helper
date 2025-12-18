import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: false, // 自定义标题栏
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // 开发环境加载本地服务，生产环境加载打包文件
  // 使用 app.isPackaged 判断是否为打包后的应用
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
    // 开发者工具默认关闭，需要时按 F12 或 Ctrl+Shift+I 打开
    // mainWindow.webContents.openDevTools()
  } else {
    // 生产环境：加载打包后的文件
    const indexPath = path.join(__dirname, '../dist/index.html')
    mainWindow.loadFile(indexPath)

    // 可选：打开开发者工具以便调试
    // mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 窗口获得焦点时通知渲染进程（用于修复图表渲染问题）
  mainWindow.on('focus', () => {
    mainWindow?.webContents.send('window:focus')
  })

  // 窗口显示时通知渲染进程
  mainWindow.on('show', () => {
    mainWindow?.webContents.send('window:show')
  })

  // 窗口恢复时通知渲染进程
  mainWindow.on('restore', () => {
    mainWindow?.webContents.send('window:restore')
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// IPC 处理 - 窗口控制
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized()
})
