class PitchWorklet extends AudioWorkletProcessor {
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
        // Measure volume (RMS)
        let rms = 0;
        for (let i = 0; i < buffer.length; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / buffer.length);

        // Ignore very quiet sounds (breathing / room noise)
        if (rms < 0.02) {
            return { frequency: 0, rms };
        }

        // Autocorrelation pitch detection
        let bestLag = -1;
        let bestCorrelation = 0;

        for (let lag = 60; lag < 700; lag++) {
            let sum = 0;
            for (let i = 0; i < buffer.length - lag; i++) {
                sum += buffer[i] * buffer[i + lag];
            }
            if (sum > bestCorrelation) {
                bestCorrelation = sum;
                bestLag = lag;
            }
        }

        if (bestLag === -1) {
            return { frequency: 0, rms };
        }

        const frequency = sampleRate / bestLag;

        // Piano frequency range
        if (frequency < 60 || frequency > 1200) {
            return { frequency: 0, rms };
        }

        return { frequency, rms };
    }
}

registerProcessor("pitch-worklet", PitchWorklet);
