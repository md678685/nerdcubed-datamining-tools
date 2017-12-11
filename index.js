const electron = require("electron");
const exec = require("child-process-promise").exec;
const fs = require("fs-promise");
const path = require("path");
const log = require("electron-log");

require("colors");

const { grabFile, setTimeoutPromise } = require("./util");

const dataDir = path.resolve(__dirname, "data/");
const execOpts = { cwd: dataDir, maxBuffer: 5 * 1024 * 1024 };

const feedUrl = "https://www.nerdcubed.co.uk/feed.json";
const liveUrl = "https://nerdcubed-live.herokuapp.com/live.json";

const debounceLimit = 25;
let debounce = 0;

async function saveVideoData(video, index) {
    while (debounce >= debounceLimit) {
        await setTimeoutPromise(500 * Math.floor(index / debounceLimit) - index);
    }
    debounce++;
    let log = (msg) => console.log(`${video.youtube_id}: ${msg}`);
    let dateObj = new Date(video.date);
    let monthDir = path.resolve(dataDir, `${dateObj.getUTCFullYear()}-${String("0" + (dateObj.getUTCMonth() + 1)).slice(-2)}`);
    let videoDir = path.resolve(monthDir, video.youtube_id + "/");
    let videoJson = path.resolve(videoDir, "video.json");
    let newVideo = {
        title: video.title,
        date: video.date,
        links: video.links,
        music: video.music,
        source: video.source,
        websiteData: {
            path: video.path,
            small: video.small,
            tags: video.tags
        }
    };

    log(`Processing video "${video.title}"`.white);
    
    if (!(await fs.exists(monthDir))) {
        log("Creating month directory...".yellow);
        try {
            await fs.mkdir(monthDir);
        } catch (e) {
            log("Month directory already exists...".red);
        }    
    }

    if (!(await fs.exists(videoDir))) {
        log("Creating video directory...".yellow);
        await fs.mkdir(videoDir);
    }

    if (await fs.exists(videoJson)) {
        log("Merging existing data with new data...".yellow);
        newVideo = Object.assign(await fs.readJson(videoJson), newVideo);
    }

    let returnValue = await fs.writeFile(videoJson, JSON.stringify(newVideo, null, 4));
    log("Video processed.".green);
    debounce--;
    return returnValue;
}

async function parseVideos(data) {
    let actions = data.map(saveVideoData);
    return await Promise.all(actions);
}

async function ready() {
    let feedGrabber;
    try {
        feedGrabber = await grabFile(feedUrl);
        await fs.writeFile(path.resolve(dataDir, "feed.json"), JSON.stringify(feedGrabber.data, null, 4));

        await parseVideos(feedGrabber.data);
        
        let addResult = await exec("git add .", execOpts);
        //console.log("git add: ", JSON.stringify(addResult));

        let commitResult = await exec(`git commit -m "Updated feed at ${(new Date()).toUTCString()}"`, execOpts);
        //console.log("git commit: ", JSON.stringify(commitResult));

        let pushResult = await exec("git push origin master", execOpts);
        //console.log("git push: ", JSON.stringify(pushResult));
        console.log("Done!".magenta);
    } catch (err) {
        console.log(err);
    } finally {
        feedGrabber.window.close();
    }
}

electron.app.on("ready", ready);
