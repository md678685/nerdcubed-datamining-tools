const electron = require("electron");
const fs = require("fs");
const path = require("path");
const log = require("electron-log");

const grabFile = require("./util").grabFile;

const feedUrl = "https://www.nerdcubed.co.uk/feed.json";
const liveUrl = "https://nerdcubed-live.herokuapp.com/live.json";

let windows = [];

electron.app.on("ready", () => {
    let feedGrabber = grabFile(feedUrl);
    windows.push(feedGrabber.window);
    feedGrabber.promise.then((feed) => {
        console.log(`Data: ${JSON.stringify(feed)}`);
        feedGrabber.window.close();
    });
});
