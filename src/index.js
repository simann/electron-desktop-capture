const { app, BrowserWindow, ipcMain, desktopCapturer, Menu, dialog } = require("electron");
const { writeFile } = require("fs/promises");
const path = require("path");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
	app.quit();
}

/**
 * Keep a reference of the window
 */
let mainWindow = null;

/**
 * Array for the media chunks
 */
let mediaChunks = [];

const createWindow = () => {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		autoHideMenuBar: true,
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, "html", "preload.js"),
		},
	});

	// and load the index.html of the app.
	mainWindow.loadFile(path.join(__dirname, "html", "index.html"));

	// Open the DevTools.
	// mainWindow.webContents.openDevTools();

	return mainWindow;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
	mainWindow = createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on("show-select-sources", async (event) => {
	const sources = await desktopCapturer.getSources({
		types: ["window", "screen"],
	});

	const template = sources.map((s) => {
		return {
			label: s.name,
			click: () => {
				mainWindow.webContents.send("select-source", {
					id: s.id,
					name: s.name,
				});
			},
		};
	});
	const menu = Menu.buildFromTemplate(template);
	menu.popup(BrowserWindow.fromWebContents(event.sender));
});

ipcMain.on("stream-chunk-received", (_, chunk) => {
	const buf = Buffer.from(chunk);
	mediaChunks.push(buf);
});

ipcMain.on("show-select-file", async () => {

	/**
	 * Open file selection dialog
	 */
	const { filePath } = await dialog.showSaveDialog(mainWindow, {
		buttonLabel: "Save video",
		defaultPath: "vid-" + Date.now() + ".webm",
	});

	if (filePath) {
		try {
			const buffer = Buffer.concat(mediaChunks);

			/**
			 * Write file to disk, propably worth to show a save dialog if it worked
			 */
			await writeFile(filePath, buffer);

			await dialog.showMessageBox(mainWindow, {
				type: "info",
				buttons: ["Ok"],
				defaultId: 1,
				title: "Success",
				message: "Video has been saved under: " + filePath,
			});

			/**
			 * Clear the chunks after the file has been saved, thus a new video can be recorder
			 * without the data of the previous
			 */
			mediaChunks = [];
		} catch (error) {
			/**
			 * The file could not be saved for various reasons
			 */
			console.log(error);
			await dialog.showMessageBox(mainWindow, {
				type: "error",
				buttons: ["Ok"],
				defaultId: 1,
				title: "Error",
				message: "Video could not been saved under: " + filePath,
				detail: e.message,
			});
		}
	} else {
		/**
		 * No file path has been selected
		 */
		await dialog.showMessageBox(mainWindow, {
			type: "error",
			buttons: ["Ok"],
			defaultId: 1,
			title: "Error",
			message: "No path to a file was provided",
		});
	}
});