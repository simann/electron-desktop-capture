const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const sourceBtn = document.getElementById("sourceBtn");
const videoElem = document.getElementById("videoElem");

/**
 * Reference to the stream
 */
let stream = null;

/**
 * Reference to the MediaRecorder
 */
let mediaRecorder = null;

/**
 * Callback for the source selection
 */
window.recorder.onSelectSource(
    /**
     * 
     * @param {any} _event 
     * @param {{
     *  id:number;
     *  name:string;
     * }} sourceData 
     */
    async (_event, sourceData) => {

        /**
         * Set the Name of the button to the selected source
         */
        sourceBtn.innerText = sourceData.name;

        /**
         * Constrains for the Stream
         */
        const streamConstraints = {
            audio: {
                mandatory: {
                    chromeMediaSource: "desktop",
                    chromeMediaSourceId: sourceData.id,
                },
            },
            video: {
                mandatory: {
                    chromeMediaSource: "desktop",
                    chromeMediaSourceId: sourceData.id,
                },
            },
        };

        /**
         * Create a stream
         */
        stream = await navigator.mediaDevices
            .getUserMedia(streamConstraints);

        videoElem.srcObject = stream;
        videoElem.play();

        /**
         * Options for the Media Recorder
         */
        const options = {
            mimeType: "video/webm; codecs=vp9",
        };

        /**
         * Create Media Recorder with the stream and the options above
         */
        mediaRecorder = new MediaRecorder(stream, options);

        /**
         * Event Handlers
         */
        mediaRecorder.ondataavailable = streamDataAvailable;
        mediaRecorder.onstop = streamEnded;
    });

const startRecord = () => {
    mediaRecorder.start();
};

const stopRecord = () => {
    mediaRecorder.stop();
};

const streamDataAvailable = async (e) => {
    /**
     * src:
     * https://github.com/electron/electron/issues/35152
     */
    const data = await e.data.arrayBuffer();
    window.recorder.streamChunkReceived(new Uint8Array(data));
};

const streamEnded = async () => {
    window.recorder.showSelectFile();
};

/**
 * Assign function from preload.js
 */
sourceBtn.onclick = window.recorder.showSelectSources;

/**
 * Assign start and stop functions to the corresponding buttons
 */
startBtn.onclick = startRecord;
stopBtn.onclick = stopRecord;