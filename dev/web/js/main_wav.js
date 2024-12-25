var globalBuffer;

// File input event listener
document.getElementById('fileInput').addEventListener('change', function () {
    var file = this.files[0];
    var reader = new FileReader();

    // The load event is fired when a file has been read successfully 
    // and at data to the global buffer
    reader.onload = function (event) {
        globalBuffer = event.target.result;
        addAudioToPage(globalBuffer, 'player-original');
        // TODO: if audio context exists, close it
        if (audioContext) {
            audioContext.close();
        }
        createAudioContext();
    };
    reader.readAsArrayBuffer(file);
});

// Process button event listener
// Process button event listener
document.getElementById('process').addEventListener('click', function () {
    showLoadingScreen();

    // Use setTimeout with 0 milliseconds to defer the execution of subsequent code
    setTimeout(function() {
        // get scaling factor from the scaling field
        scalingInput = document.getElementById('scaling')
        var scaling = parseFloat(scalingInput.value);
        if (isNaN(scaling)) {
            scaling = 1;
            scalingInput.value = scaling;
        }

        if (globalBuffer == null) {
            alert("Please select a file first");
            return;
        }

        ParseWavFile(globalBuffer, scaling);
    }, 100);
});


// slider changed event listener
document.getElementById('scaling').addEventListener('input', function () {
    var scalingValue = document.getElementById('scalingValue')
    scalingValue.innerHTML = this.value;
});
// ***************************************************************************************
//                 Utility Functions
// ***************************************************************************************

function ParseWavFile(buffer, scaling) {
    let wav = new wavefile.WaveFile();
    // read wav file from buffer and get samples
    // wav.fromBuffer(new Uint8Array(buffer));
    wav.fromBuffer(new Uint8Array(buffer));
    let sampleRate = wav.fmt.sampleRate;
    let bitDepth = wav.bitDepth;
    console.log(wav);
    let samplesRaw = wav.getSamples();

    // prepare samples according to the number of cannels
    nummberOfChannels = wav.fmt.numChannels;
    if (nummberOfChannels > 1) {
        console.log("Stereo");
        samplesRaw = samplesRaw[0];
    }

    Tsm(samplesRaw, scaling, sampleRate, bitDepth);

}

function createWaveFile(samples, sampleRate, bitDepth, player) {
    let wav = new wavefile.WaveFile();
    wav.fromScratch(1, sampleRate, bitDepth, samples);
    addAudioToPage(wav.toBuffer(), player);
}

/**
 * Add audio to the page
 * 
 * @param {*} audioData 
 * @param {*} player 
 */
function addAudioToPage(audioData, player) {
    var blob = new Blob([audioData], { type: 'audio/wav' });
    var blobUrl = URL.createObjectURL(blob);
    var audioPlayer = document.getElementById(player);
    audioPlayer.src = blobUrl;
}




