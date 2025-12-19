class PitchProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 2048;
        this.buffer = new Float32Array(this.bufferSize);
        this.index = 0;
    }

    process(inputs) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const channel = input[0];

        for (let i = 0; i < channel.length; i++) {
            this.buffer[this.index++] = channel[i];

            if (this.index >= this.bufferSize) {
                const result = this.detectPitch(this.buffer, sampleRate);
                this.port.postMessage(result);
                this.index = 0;
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

        // LOWER threshold for piano
        if (rms < 0.002) {
            return { frequency: 0 };
        }

        let bestLag = -1;
        let bestCorr = 0;

        for (let lag = 50; lag < buffer.length / 2; lag++) {
            let sum = 0;
            for (let i = 0; i < buffer.length - lag; i++) {
                sum += buffer[i] * buffer[i + lag];
            }
            if (sum > bestCorr) {
                bestCorr = sum;
                bestLag = lag;
            }
        }

        if (bestLag === -1) return { frequency: 0 };

        const freq = sampleRate / bestLag;
        if (freq < 50 || freq > 2000) return { frequency: 0 };

        return { frequency: freq };
    }
}

registerProcessor("pitch-processor", PitchProcessor);
