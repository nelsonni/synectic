import { app, BrowserWindow } from 'electron';
declare var __dirname: string;
let mainWindow: Electron.BrowserWindow;

function onReady() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1000,
    show: true
  });

  const fileName = `file://${__dirname}/index.html`;
  mainWindow.loadURL(fileName);
  mainWindow.on('close', () => app.quit());
}

function onClose() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}

app.on('ready', () => onReady());
app.on('window-all-closed', () => onClose());
app.on('activate', () => onReady());
