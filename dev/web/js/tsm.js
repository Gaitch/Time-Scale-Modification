function Tsm(samplesRaw, scaling, sampleRate, bitDepth) {
    let signal = samplesRaw;
    let samples = [];
    let frames = [];

    frames = Analyse(samplesRaw, 1024, 1024)
    spectrogram = MagStft(frames);
    drawSpectrogram(spectrogram, 'spectrogram-original', 1160, 300);

    samples = resample(samplesRaw, scaling)
    frames = Analyse(samples, 1024, 1024)
    spectrogram = MagStft(frames);
    drawSpectrogram(spectrogram, 'spectrogram-dec', 1160, 300);
    createWaveFile(samples, sampleRate, bitDepth, 'player-decimated');

    samples = overlapAdd(samplesRaw, scaling, 1024, 512)
    frames = Analyse(samples, 1024, 1024)
    spectrogram = MagStft(frames);
    drawSpectrogram(spectrogram, 'spectrogram-ola', 1160, 300);
    createWaveFile(samples, sampleRate, bitDepth, 'player-overlap-add');

    samples = PhaseVocoder(samplesRaw, scaling, 1024, 512)
    frames = Analyse(samples, 1024, 1024)
    spectrogram = MagStft(frames);
    //drawSpectrogram(spectrogram, 'spectrogram-pv', 1160, 300);
    createWaveFile(samples, sampleRate, bitDepth, 'player-phase-vocoder');

    hideLoadingScreen();
}

/**
 * hann window function
 * 
 * @param {*} i 
 * @param {*} N 
 * @returns 
 */
function Hann(i, N) {
    return 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
}

/**
 * 
 * @param {*} frames 
 * @returns 
 */
function Windowing(frames) {
    let frameSize = frames[0].length;
    for (let i = 0; i < frames.length; i++) {
        for (let j = 0; j < frameSize; j++) {
            frames[i][j] = frames[i][j] * Hann(j, frameSize);
        }
    }
    return frames;
}

/**
 * 
 * @param {*} samples 
 * @param {*} a 
 * @returns 
 */
function overlapAdd(samples, scaling, frameSize, analysesHopSize) {
    let frames = [];

    frames = Analyse(samples, frameSize, analysesHopSize);
    frames = Windowing(frames);
    frames = Synthesize(frames, analysesHopSize, scaling);
    return frames;
}

/**
 * 
 * @param {*} samples 
 * @param {*} frameSize 
 * @param {*} analysesHopSize 
 * @returns 
 */
function Analyse(samples, frameSize, analysesHopSize) {
    let frames = [];

    for (let i = 0; i < samples.length; i += analysesHopSize) {
        const frame = [];
        const endIndex = Math.min(i + frameSize, samples.length); // Adjusted frame end index considering overlap

        for (let j = i; j < endIndex; j++) {
            frame.push(samples[j]);
        }

        // If the frame is shorter than frameSize, pad with zeros
        while (frame.length < frameSize) {
            frame.push(0);
        }

        frames.push(frame);
    }
    return frames;
}


/**
 * 
 * @param {*} frames 
 * @param {*} inputHopSize 
 * @param {*} scaleFactor 
 * @returns 
 */
function Synthesize(frames, inputHopSize, scaleFactor) {
    scaleFactor = 1 / scaleFactor;

    const numFrames = frames.length;
    const frameSize = frames[0].length;
    const outputLength = Math.round(frameSize * scaleFactor + (numFrames - 1) * inputHopSize * scaleFactor);
    const result = new Array(outputLength).fill(0);

    // Calculate the synthesis hop size based on the scaling factor
    const outputHopSize = Math.ceil(inputHopSize * scaleFactor);

    for (let i = 0; i < numFrames; i++) {
        const startSample = Math.round(i * inputHopSize * scaleFactor);
        const endSample = Math.min(startSample + frameSize, outputLength);

        for (let j = 0; j < endSample - startSample; j++) {
            result[startSample + j] += frames[i][j];
        }
    }
    return result;

}


/**
 * 
 * @param {*} samples 
 * @param {*} alpha 
 * @param {*} frameLength 
 * @param {*} frameStep 
 * @returns 
 */
function PhaseVocoder(samples, alpha, frameLength, frameStep) {
    let frames = Analyse(samples, frameLength, frameStep);
    let spectrogram = [];
    let frame = [];
    let fftTensor = [];
    for (let i = 0; i < frames.length; i++) {
        frame = frames[i];
        frame = Windowing(frame);
        fftTensor = tf.spectral.rfft(tf.tensor1d(frames[i]), frameLength);
        spectrogram.push(fftTensor);
    }

    alpha = 1 / alpha;
    spectrogram = linearInterpolation(spectrogram, alpha);

    let result = [];
    let signal = [];
    for (let i = 0; i < spectrogram.length; i++) {
        signal = tf.spectral.irfft(spectrogram[i], frameLength);
        signal = signal.arraySync(); // Jeden Wert durch 2 teilen
        result.push(signal.flat().map(value => value / 2));
    }

    result = Synthesize(result, frameStep, 1);
    return result;
}