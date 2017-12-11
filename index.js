const electron = require("electron");
const exec = require("child-process-promise").exec;
const fs = require("fs-extra");
const path = require("path");

require("colors");

const { grabFile, padLeft, setTimeoutPromise } = require("./util");

const dataDir = path.resolve(__dirname, "data/");
const execOpts = { cwd: dataDir, maxBuffer: 5 * 1024 * 1024 };

const feedUrl = "https://www.nerdcubed.co.uk/feed.json";
const liveUrl = "https://nerdcubed-live.herokuapp.com/live.json"; // eslint-disable-line no-unused-vars

const debounceLimit = 25;
let debounce = 0;

async function saveVideoData(video, index) {
    while (debounce >= debounceLimit) {
        // eslint-disable-next-line no-await-in-loop
        await setTimeoutPromise((500 * Math.floor(index / debounceLimit)) - index);
    }
    debounce += 1;
    const log = msg => console.log(`${video.youtube_id}: ${msg}`);
    const dateObj = new Date(video.date);
    const monthDir = path.resolve(dataDir,
        `${dateObj.getUTCFullYear()}-${padLeft(dateObj.getUTCMonth() + 1, "0", 2)}`);
    const videoDir = path.resolve(monthDir, video.youtube_id);
    const videoJson = path.resolve(videoDir, "video.json");
    const newVideo = {
        title: video.title,
        date: video.date,
        links: video.links,
        music: video.music,
        source: video.source,
        websiteData: {
            path: video.path,
            small: video.small,
            tags: video.tags,
        },
    };

    log(`Processing video "${video.title}"`.white);

    await fs.ensureDir(videoDir);

    if (await fs.exists(videoJson)) {
        log("Merging existing data with new data...".yellow);
        newVideo = Object.assign(await fs.readJson(videoJson), newVideo);
    }

    const returnValue = await fs.writeFile(videoJson, JSON.stringify(newVideo, null, 4));
    log("Video processed.".green);
    debounce -= 1;
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

        console.log("Staging changes...".cyan);
        let addResult = await exec("git add .", execOpts);
        //console.log("git add: ", JSON.stringify(addResult));

        console.log("Committing changes...".cyan);
        let commitResult = await exec(`git commit -m "Updated feed at ${(new Date()).toUTCString()}"`, execOpts);
        //console.log("git commit: ", JSON.stringify(commitResult));

        console.log("Pushing changes...".cyan);
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
