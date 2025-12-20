class PitchWorklet extends AudioWorkletProcessor {
    constructor() {
        super();
        this.size = 2048;
        this.buffer = new Float32Array(this.size);
        this.index = 0;
    }

    process(inputs) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const channel = input[0];

        for (let i = 0; i < channel.length; i++) {
            this.buffer[this.index++] = channel[i];

            if (this.index >= this.size) {
                const result = this.detect(this.buffer, sampleRate);
                this.port.postMessage(result);
                this.index = 0;
            }
        }
        return true;
    }

    detect(buffer, sampleRate) {
        // RMS (volume)
        let rms = 0;
        for (let i = 0; i < buffer.length; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / buffer.length);

        // Piano-tuned gate
        if (rms < 0.02) {
            return { frequency: 0, rms };
        }

        // Autocorrelation
        let bestLag = -1;
        let bestCorr = 0;

        for (let lag = 60; lag < 700; lag++) {
            let sum = 0;
            for (let i = 0; i < buffer.length - lag; i++) {
                sum += buffer[i] * buffer[i + lag];
            }
            if (sum > bestCorr) {
                bestCorr = sum;
                bestLag = lag;
            }
        }

        if (bestLag === -1) return { frequency: 0, rms };

        const freq = sampleRate / bestLag;

        // Piano range
        if (freq < 60 || freq > 1200) {
            return { frequency: 0, rms };
        }

        return { frequency: freq, rms };
    }
}

registerProcessor("pitch-worklet", PitchWorklet);
