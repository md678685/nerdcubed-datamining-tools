const ipcRenderer = require("electron").ipcRenderer;
let $;

window.onload = () => {
    $ = window.$ = window.jQuery = require("jquery");
    ipcRenderer.send("util-ready");
};

ipcRenderer.on("xhrGet", (event, url) => {
    console.log(`Getting URL: ${url}`);
    $.get(url, (data, status) => {
        console.log(data, status);
        event.sender.send("xhrGet-return", data);
    });
});
