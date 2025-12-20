class PitchProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 2048;
        this.buffer = new Float32Array(this.bufferSize);
        this.writeIndex = 0;
    }

    process(inputs) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const channel = input[0];

        for (let i = 0; i < channel.length; i++) {
            this.buffer[this.writeIndex++] = channel[i];

            if (this.writeIndex >= this.bufferSize) {
                const result = this.detectPitch(this.buffer, sampleRate);
                this.port.postMessage(result);
                this.writeIndex = 0;
            }
        }
        return true;
    }

    detectPitch(buffer, sampleRate) {
        let rms = 0;
        for (let i = 0; i < buffer.length; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / buffer.length);

        // Gate (tuned for electric keyboard + iPhone)
        if (rms < 0.012) {
            return { frequency: 0, rms };
        }

        let bestLag = -1;
        let bestCorr = 0;

        for (let lag = 50; lag < buffer.length / 2; lag++) {
            let corr = 0;
            for (let i = 0; i < buffer.length - lag; i++) {
                corr += buffer[i] * buffer[i + lag];
            }
            if (corr > bestCorr) {
                bestCorr = corr;
                bestLag = lag;
            }
        }

        if (bestLag === -1) return { frequency: 0, rms };

        const freq = sampleRate / bestLag;
        if (freq < 50 || freq > 2000) return { frequency: 0, rms };

        return { frequency: freq, rms };
    }
}

registerProcessor('pitch-processor', PitchProcessor);
