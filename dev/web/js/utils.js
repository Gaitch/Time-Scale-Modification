function MagFft(frame) {
    let fftlen = frame.length;
    signal = tf.tensor1d(Array.from(frame));
    let spectrum = tf.spectral.rfft(signal, fftlen);
    spectrum = tf.abs(spectrum);

    // Find the maximum value in the spectrum
    const maxVal = spectrum.max().arraySync();

    // Normalize the spectrum by dividing each value by the maximum value
    const normalizedSpectrum = spectrum.div(maxVal);

    // Print or use the normalized spectrum
    //normalizedSpectrum.print();

    // Return the normalized spectrum as a regular JavaScript array
    return normalizedSpectrum.arraySync();
}

function ifft(spectrum) {
    spectrum = tf.tensor1d(Array.from(spectrum));
    let signal = tf.spectral.irfft(spectrum);
    return signal.arraySync();
}

/**
 * 
 * @param {*} frames 
 * @returns Spectrogram as a 2D array
 */
function MagStft(frames) {
    console.log("STFT started");
    let spectrogram = [];
    let spectrum = [];
    for (let i = 0; i < frames.length; i++) {
        spectrum = MagFft(frames[i]);
        spectrogram.push(spectrum);
    }
    console.log("STFT done");
    return spectrogram;
}

function istft(spectorgram) {
    let frames = [];
    let frame = [];
    for (let i = 0; i < spectorgram.length; i++) {
        frame = ifft(spectorgram[i]);
        frames.push(frame);
    }
    return frames;
}

// ***************************************************************************************
//                 Decination and Interpolation
// ***************************************************************************************

function upsample(signal, factor) {
    const upsampled = [];
    for (let i = 0; i < signal.length; i++) {
        upsampled.push(signal[i]);
        for (let j = 1; j < factor; j++) {
            upsampled.push(0);
        }
    }
    return upsampled;
}

function downsample(signal, factor) {
    const decimated = [];
    for (let i = 0; i < signal.length; i += factor) {
        decimated.push(signal[i]);
    }
    return decimated;
}

function interpolate(signal, factor) {
    const interpolated = [];
    for (let i = 0; i < signal.length - 1; i++) {
        interpolated.push(signal[i]);
        for (let j = 1; j < factor; j++) {
            interpolated.push(signal[i] + (signal[i + 1] - signal[i]) * (j / factor));
        }
    }
    interpolated.push(signal[signal.length - 1]);
    return interpolated;
}

/**
 * Decimate the samples
 * 
 * @param {*} samples
 * @returns newSamples
 */
function resample(samples, scaling) {
    const factor = math.fraction(scaling);
    const upsampledSignal = upsample(samples, factor.d);
    let decimatedSignal = [];
    console.log("Decimate: " + scaling);
    if (scaling > 1) {
        decimatedSignal = downsample(upsampledSignal, factor.n);
    }
    else {
        decimatedSignal = interpolate(upsampledSignal, scaling);
    }

    return decimatedSignal;
}


/**
 * Linear interpolation of each element in 2d array
 * 
 **/
function linearInterpolation(input, factor) {

    // input is a an array with tensors
    // so we have to convert each tensor into an array
    // but since the tensor contains a complex number we 
    // have to interpolate the real and imaginary part separately
    // and then create a new tensor from the interpolated values
    // and push it to the output array

    // 1. lets go through the input array and convert each tensor 
    // into two arrays of real and imaginary parts and store them in Matrix
    let imagMatrix = [];
    let realMatrix = [];
    for (let i = 0; i < input.length; i++) {
        let tensor = input[i];
        let realArray = tf.real(tensor).arraySync();
        let imagArray = tf.imag(tensor).arraySync();


        imagMatrix.push(imagArray);
        realMatrix.push(realArray);
    }


    // 2. interpolate the real and imaginary parts
    interpolatedRealMatrix = interpolateComplex(realMatrix, factor);
    interpolatedImagMatrix = interpolateComplex(imagMatrix, factor);
    console.log("interpolatedRealMatrix");
    console.log(interpolatedRealMatrix.length);
    console.log("interpolatedImagMatrix");
    console.log(interpolatedImagMatrix.length);
    //console.log("interpolatedRealMatrix");
    //console.log(interpolatedRealMatrix);
    //console.log("interpolatedImagMatrix");
    //console.log(interpolatedImagMatrix );


    // reconstruct the complex tensor from the interpolated real and imaginary parts
    let output = [];
    for (let i = 0; i < interpolatedRealMatrix.length; i++) {
        let realArray = interpolatedRealMatrix[i];
        let imagArray = interpolatedImagMatrix[i];
        //console.log(realArray);
        //console.log(imagArray);
        const real = tf.tensor1d(Float32Array.from(realArray));
        const imag = tf.tensor1d(Float32Array.from(imagArray));
        const complex = tf.complex(real, imag);
        output.push(complex);
    }
    //console.log(output);
    return output;
}


function interpolateComplex(Matrix, scaleFactor) {
    let output = [];
    const interpolatedLength = Math.floor(Matrix.length * scaleFactor);
    const step = (Matrix.length - 1) / (interpolatedLength - 1);

    // Interpolate each row
    for (let i = 0; i < interpolatedLength; i++) {
        const index = i * step;
        const floorIndex = Math.floor(index);
        const t = index - floorIndex;

        if (floorIndex === Matrix.length - 1) {
            // If the floor index is the last row, push it directly
            output.push(Matrix[floorIndex]);
        } else {
            // Interpolate between two adjacent rows
            let currentRow = Matrix[floorIndex].flat();
            let nextRow = Matrix[floorIndex + 1].flat();
            let interpolatedRow = [];

            // Interpolate between corresponding elements of two adjacent rows
            for (let j = 0; j < currentRow.length; j++) {
                const interpolatedValue = currentRow[j] * (1 - t) + nextRow[j] * t;
                interpolatedRow.push(interpolatedValue);
            }
            output.push(interpolatedRow);
        }
    }
    return output;
}
