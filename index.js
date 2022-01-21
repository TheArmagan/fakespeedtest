const axios = require("axios").default;
const { MD5, enc } = require("crypto-js");
const { BrowserWindow, app, ipcMain } = require("electron");
const path = require("path");
const express = require("express");
const eApp = express();
const XML = require("xml2js");
const util = require("util");

eApp.use(express.static(path.resolve(__dirname, "public")));

eApp.listen(1976);
console.log("\n");

app.once("ready", () => {
  let browserWindow = new BrowserWindow({
    width: 800,
    height: 800,
    darkTheme: true,
    webPreferences: {
      nodeIntegration: true,
    },
    title: "Speed Test Faker - Created By Kıraç Armağan Önal",
  });

  browserWindow.loadURL("http://localhost:1976/");

  browserWindow.on("ready-to-show", () => {
    browserWindow.show();
  });

  ipcMain.on("fakeTest", async (event, opts) => {
    let input = {
      ping: Math.round(opts.ping),
      download: opts.download * 1000,
      upload: opts.upload * 1000,
      serverid: opts.serverid || 11250,
    };
    let response = await axios({
      method: "POST",
      url: "http://www.speedtest.net/api/api.php",
      headers: {
        referer: "http://c.speedtest.net/flash/speedtest.swf",
      },
      data: Object.entries({
        ...input,
        recommendedserverid: input.serverid,
        startmode: "pingselect",
        accuracy: 10,
        hash: MD5(
          `${input.ping}-${input.upload}-${input.download}-297aae72`
        ).toString(enc.Hex),
        promo: "",
      })
        .map((i) => `${i[0]}=${i[1]}`)
        .join("&"),
    });

    browserWindow.webContents.send("resultId", response.data.resultid);
  });

  ipcMain.on("serverList", async () => {
    console.log("[SL] Getting servers..");
    let results = new Map();

    for (let i = 0; i < 10; i++) {
      let { data: xmlData } = await axios({
        method: "GET",
        url: "https://c.speedtest.net/speedtest-servers-static.php",
        responseType: "text",
      });
      let parsed = await XML.parseStringPromise(xmlData, {
        normalize: true,
        normalizeTags: true,
      });
      let servers = parsed.settings.servers[0].server.map((i) => i.$);
      servers.forEach((s) => {
        results.set(s.id, s);
      });
      console.log(`[SL] Iteration ${i + 1} is completed!`);
    }

    console.log("[SL] All servers are got!");
    const serversArray = Array.from(results.values());
    console.log(util.inspect(serversArray, false, 3, false));

    browserWindow.webContents.send("serverList", serversArray);
  });
});

app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());
