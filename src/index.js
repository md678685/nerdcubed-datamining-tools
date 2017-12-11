const electron = require('electron')
const exec = require('child-process-promise').exec
const fs = require('fs-extra')
const path = require('path')
require('colors')

const { grabFile, setTimeoutPromise } = require('./util')

const dataDir = path.resolve(__dirname, 'data/')
const execOpts = { cwd: dataDir, maxBuffer: 5 * 1024 * 1024 }

const feedUrl = 'https://www.nerdcubed.co.uk/feed.json'

const debounceLimit = 25
let debounce = 0weadfsef

const saveVideoData = async (video, index) => {
  while (debounce >= debounceLimit) { // eslint-disable-line
    await setTimeoutPromise((500 * Math.floor(index / debounceLimit)) - index)
  }
  debounce++
  let logger = msg => console.log(`${video.youtube_id}: ${msg}`)
  let dateObj = new Date(video.date)
  let monthDir = path.resolve(dataDir, `${dateObj.getUTCFullYear()}-${String(`0${dateObj.getUTCMonth() + 1}`).slice(-2)}`)
  let videoDir = path.resolve(monthDir, `${video.youtube_id}/`)
  let videoJson = path.resolve(videoDir, 'video.json')
  let newVideo = {
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
  }

  logger(`Processing video "${video.title}"`.white)

  if (!await fs.exists(monthDir)) {
    logger('Creating month directory...'.yellow)
    try {
      await fs.mkdir(monthDir)
    } catch (e) {
      logger('Month directory already exists...'.red)
    }
  }

  if (!await fs.exists(videoDir)) {
    logger('Creating video directory...'.yellow)
    await fs.mkdir(videoDir)
  }

  if (await fs.exists(videoJson)) {
    logger('Merging existing data with new data...'.yellow)
    newVideo = Object.assign(await fs.readJson(videoJson), newVideo)
  }

  let returnValue = await fs.writeFile(videoJson, JSON.stringify(newVideo, null, 4))
  logger('Video processed.'.green)
  debounce--
  return returnValue
}

const parseVideos = data => {
  let actions = data.map(saveVideoData)
  return Promise.all(actions)
}

const ready = async () => {
  let feedGrabber
  try {
    feedGrabber = await grabFile(feedUrl)
    await fs.writeFile(path.resolve(dataDir, 'feed.json'), JSON.stringify(feedGrabber.data, null, 4))

    await parseVideos(feedGrabber.data)

    console.log('Staging changes...'.cyan)
    await exec('git add .', execOpts)

    console.log('Committing changes...'.cyan)
    await exec(`git commit -m "Updated feed at ${(new Date()).toUTCString()}"`, execOpts)

    console.log('Pushing changes...'.cyan)
    await exec('git push origin master', execOpts)

    console.log('Done!'.magenta)
  } catch (err) {
    console.log(err)
  } finally {
    feedGrabber.window.close()
  }
}

electron.app.on('ready', ready)
