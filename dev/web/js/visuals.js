let audioContext;
let analyzer;
let timeDataArray;
let frequencyDataArray;
let timeCanvas;
let timeCanvasContext;
let frequencyCanvas;
let frequencyCanvasContext;
let bufferLength;

function createAudioContext() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    catch (error) {
        console.log('Failed to create AudioContext:', error);
        return;
    }
    // Check if audioContext is successfully created
    if (!audioContext) {
        console.log('Failed to create AudioContext.');
        return;
    }

    // create an analayser node for data extraction and processing
    analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 2048;

    bufferLength = analyzer.frequencyBinCount;

    timeDataArray = new Uint8Array(bufferLength);
    frequencyDataArray = new Uint8Array(bufferLength);
    analyzer.getByteTimeDomainData(timeDataArray);
    analyzer.getByteFrequencyData(frequencyDataArray);

    const audioElement = document.getElementById('player-original')
    audioElement.addEventListener('canplay', function () {
        // start audio playback
        //audioElement.play();

        // connection the different nodes to create a processing chain
        // source -> analyser -> destination
        const source = audioContext.createMediaElementSource(audioElement);

        console.log("source: " + source);

        source.connect(analyzer);
        analyzer.connect(audioContext.destination);
        //analyser.connect(audioContext.destination);
        timeCanvas = document.getElementById('waveform-original');
        timeCanvasContext = timeCanvas.getContext("2d");
        frequencyCanvas = document.getElementById('spectrum-original');
        frequencyCanvasContext = frequencyCanvas.getContext("2d");
        timeCanvasContext.clearRect(0, 0, timeCanvas.width, timeCanvas.height);
        frequencyCanvasContext.clearRect(0, 0, frequencyCanvas.width, frequencyCanvas.height);
        draw();
    });
}

function draw(bufferLength) {
    var drawVisual = requestAnimationFrame(draw);

    analyzer.getByteTimeDomainData(timeDataArray);

    // Clear the canvas
    timeCanvasContext.clearRect(0, 0, timeCanvas.width, timeCanvas.height);
    frequencyCanvasContext.clearRect(0, 0, frequencyCanvas.width, frequencyCanvas.height);

    // Set up canvas drawing parameters
    timeCanvasContext.fillStyle = "rgb(0,0,0)";
    timeCanvasContext.fillRect(0, 0, timeCanvas.width, timeCanvas.height);
    timeCanvasContext.lineWidth = 5;
    timeCanvasContext.strokeStyle = "rgb(0, 180, 255)";
    timeCanvasContext.beginPath();

    const sliceWidth = timeCanvas.width / 1024;
    let x = 0;

    for (let i = 0; i < 1204; i++) {
        let v = timeDataArray[i] / 128.9;
        let y = v * timeCanvas.height / 2;

        if (i === 0) {
            timeCanvasContext.moveTo(x, y);
        } else {
            timeCanvasContext.lineTo(x, y);
        }
        x += sliceWidth;
    }

    timeCanvasContext.lineTo(timeCanvas.width, timeCanvas.height / 2);
    timeCanvasContext.stroke();


    analyzer.getByteFrequencyData(frequencyDataArray);


    frequencyCanvasContext.fillStyle = "rgb(0 0 0)";
    frequencyCanvasContext.fillRect(0, 0, frequencyCanvas.width, frequencyCanvas.height);
    const barWidth = (frequencyCanvas.width / 256) * 2.5;
    let barHeight;
    let u = 0;

    for (let i = 0; i < 256; i++) {
        barHeight = frequencyDataArray[i] * 2;

        frequencyCanvasContext.fillStyle = `rgb( 0 ${180} ${barHeight + 255})`;
        frequencyCanvasContext.fillRect(u, frequencyCanvas.height - barHeight / 2, barWidth, barHeight);

        u += barWidth + 1;
    }
}



function drawSpectrogram(data, canvasId, width, height) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');

    // Ensure the canvas dimensions match the specified width and height
    canvas.width = width;
    canvas.height = height;

    const numRows = data[0].length;
    const numCols = data.length;
    const cellWidth = width / numCols;
    const cellHeight = height / numRows;

    // Convert amplitude to decibels
    let dBData = data.map(row => row.map(value => 10 * Math.log10(value + 1e-10))); // Adding a small value to avoid log(0)

    // Get the min and max values of the dB data for normalization
    let minValue = Infinity;
    let maxValue = -Infinity;
    for (let row of dBData) {
        for (let value of row) {
            if (value < minValue) minValue = value;
            if (value > maxValue) maxValue = value;
        }
    }

    // Function to normalize dB values to a 0-1 range
    function normalize(value) {
        return (value - minValue) / (maxValue - minValue);
    }

    // Draw the spectrogram
    for (let i = 0; i < numCols; i++) {
        for (let j = 0; j < numRows; j++) {
            ctx.fillStyle = getViridisColor(normalize(dBData[i][j]));
            ctx.fillRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
        }
    }
}

// Function to show the loading screen
function showLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'block';
}

// Function to hide the loading screen
function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
}

// Helper function to get the color from a viridis colormap
function getViridisColor(value) {
    const colormap = [
        [68, 1, 84], [68, 2, 85], [69, 4, 87], [69, 5, 88], [70, 7, 90], [70, 8, 91], [70, 10, 93], [71, 11, 94], [71, 13, 96], [71, 14, 97],
        [71, 16, 98], [71, 17, 100], [72, 18, 101], [72, 20, 103], [72, 21, 104], [72, 23, 105], [72, 24, 107], [72, 25, 108], [72, 27, 109], [72, 28, 110],
        [72, 29, 111], [72, 31, 112], [72, 32, 113], [72, 34, 114], [72, 35, 115], [72, 36, 116], [72, 38, 117], [72, 39, 118], [72, 40, 119], [72, 42, 120],
        [71, 43, 121], [71, 44, 121], [71, 46, 122], [71, 47, 123], [71, 48, 124], [71, 50, 124], [71, 51, 125], [71, 52, 126], [71, 54, 126], [71, 55, 127],
        [71, 56, 127], [70, 58, 128], [70, 59, 128], [70, 60, 129], [70, 61, 129], [70, 63, 130], [70, 64, 130], [69, 65, 131], [69, 66, 131], [69, 68, 131],
        [69, 69, 132], [69, 70, 132], [68, 71, 132], [68, 73, 132], [68, 74, 133], [68, 75, 133], [67, 76, 133], [67, 77, 133], [67, 79, 133], [66, 80, 134],
        [66, 81, 134], [66, 82, 134], [66, 83, 134], [65, 85, 134], [65, 86, 134], [65, 87, 134], [64, 88, 134], [64, 89, 134], [64, 91, 134], [63, 92, 135],
        [63, 93, 135], [63, 94, 135], [62, 95, 135], [62, 97, 135], [62, 98, 135], [61, 99, 135], [61, 100, 135], [61, 101, 135], [60, 102, 135], [60, 103, 135],
        [60, 105, 135], [59, 106, 135], [59, 107, 135], [58, 108, 135], [58, 109, 135], [58, 110, 135], [57, 111, 135], [57, 112, 135], [56, 113, 135], [56, 115, 135],
        [56, 116, 135], [55, 117, 135], [55, 118, 135], [54, 119, 135], [54, 120, 135], [54, 121, 134], [53, 122, 134], [53, 123, 134], [52, 124, 134], [52, 125, 134],
        [51, 126, 134], [51, 127, 134], [50, 128, 134], [50, 129, 134], [50, 130, 134], [49, 131, 133], [49, 132, 133], [48, 133, 133], [48, 134, 133], [47, 135, 133],
        [47, 136, 133], [46, 137, 132], [46, 138, 132], [45, 139, 132], [45, 140, 132], [44, 141, 132], [44, 142, 131], [43, 143, 131], [43, 144, 131], [42, 145, 131],
        [42, 146, 130], [41, 147, 130], [41, 148, 130], [40, 149, 130], [40, 150, 129], [39, 151, 129], [39, 152, 129], [38, 153, 128], [38, 154, 128], [37, 155, 128],
        [37, 156, 127], [36, 157, 127], [36, 158, 127], [35, 159, 126], [35, 160, 126], [34, 161, 126], [34, 162, 125], [33, 163, 125], [33, 164, 124], [32, 165, 124],
        [32, 166, 123], [31, 167, 123], [31, 168, 123], [30, 169, 122], [30, 170, 122], [29, 171, 121], [29, 172, 121], [28, 173, 120], [28, 174, 120], [27, 175, 119],
        [27, 176, 118], [26, 177, 118], [26, 178, 117], [25, 179, 117], [25, 179, 116], [24, 180, 116], [24, 181, 115], [24, 182, 114], [23, 183, 114], [23, 184, 113],
        [22, 185, 112], [22, 186, 112], [21, 187, 111], [21, 188, 110], [21, 189, 110], [20, 190, 109], [20, 191, 108], [19, 192, 108], [19, 193, 107], [19, 194, 106],
        [18, 195, 105], [18, 196, 105], [18, 197, 104], [17, 198, 103], [17, 199, 102], [16, 200, 102], [16, 201, 101], [16, 202, 100], [15, 203, 99], [15, 204, 98],
        [15, 205, 97], [14, 206, 96], [14, 207, 96], [14, 208, 95], [13, 209, 94], [13, 210, 93], [13, 211, 92], [13, 212, 91], [12, 213, 90], [12, 214, 89],
        [12, 215, 88], [11, 216, 87], [11, 217, 86], [11, 218, 85], [11, 219, 84], [10, 220, 83], [10, 221, 82], [10, 222, 81], [10, 223, 80], [10, 224, 79],
        [10, 225, 78], [9, 226, 77], [9, 227, 76], [9, 228, 75], [9, 229, 74], [9, 230, 73], [9, 231, 72], [9, 232, 71], [8, 233, 70], [8, 234, 69],
        [8, 235, 68], [8, 236, 67], [8, 237, 66], [8, 238, 65], [8, 239, 64], [8, 240, 63], [8, 241, 62], [8, 242, 61], [8, 243, 60], [8, 244, 59],
        [7, 245, 58], [7, 246, 57], [7, 247, 56], [7, 248, 55], [7, 249, 54], [7, 250, 53], [7, 251, 52], [7, 252, 51], [7, 253, 50], [7, 254, 49]
    ];

    const index = Math.floor(value * (colormap.length - 1));
    return `rgb(${colormap[index][0]}, ${colormap[index][1]}, ${colormap[index][2]})`;
}