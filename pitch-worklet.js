class PitchWorklet extends AudioWorkletProcessor {
    constructor() {
        super();
        this.fftSize = 2048;
        this.buffer = new Float32Array(this.fftSize);
        this.index = 0;
    }

    process(inputs) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const channel = input[0];

        for (let i = 0; i < channel.length; i++) {
            this.buffer[this.index++] = channel[i];

            if (this.index >= this.fftSize) {
                const result = this.detectFFT(this.buffer, sampleRate);
                this.port.postMessage(result);
                this.index = 0;
            }
        }
        return true;
    }

    detectFFT(buffer, sampleRate) {
        // RMS volume check
        let rms = 0;
        for (let i = 0; i < buffer.length; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / buffer.length);

        if (rms < 0.03) {
            return { frequency: 0, rms };
        }

        // Simple FFT magnitude estimation
        let bestIndex = -1;
        let bestMag = 0;

        for (let k = 20; k < 1000; k++) {
            let real = 0;
            let imag = 0;
            const phaseStep = (2 * Math.PI * k) / buffer.length;

            for (let n = 0; n < buffer.length; n++) {
                real += buffer[n] * Math.cos(phaseStep * n);
                imag -= buffer[n] * Math.sin(phaseStep * n);
            }

            const mag = real * real + imag * imag;
            if (mag > bestMag) {
                bestMag = mag;
                bestIndex = k;
            }
        }

        if (bestIndex === -1) {
            return { frequency: 0, rms };
        }

        const frequency = (bestIndex * sampleRate) / buffer.length;

        if (frequency < 60 || frequency > 1200) {
            return { frequency: 0, rms };
        }

        return { frequency, rms };
    }
}

registerProcessor("pitch-worklet", PitchWorklet);
