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

        const channelData = input[0];
        
        for (let i = 0; i < channelData.length; i++) {
            this.buffer[this.writeIndex] = channelData[i];
            this.writeIndex++;
            
            if (this.writeIndex >= this.bufferSize) {
                const pitch = this.detectPitch(this.buffer, sampleRate);
                this.port.postMessage(pitch);
                this.writeIndex = 0;
            }
        }

        return true;
    }

    detectPitch(buffer, sampleRate) {
        // Simple autocorrelation pitch detection
        let rms = 0;
        for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
        rms = Math.sqrt(rms / buffer.length);
        
        if (rms < 0.01) return { frequency: 0, confidence: 0 };

        const n = buffer.length;
        let bestLag = -1;
        let bestCorr = -1;

        for (let lag = 50; lag < n / 2; lag++) {
            let sum = 0;
            for (let i = 0; i < n - lag; i++) {
                sum += buffer[i] * buffer[i + lag];
            }
            if (sum > bestCorr) {
                bestCorr = sum;
                bestLag = lag;
            }
        }

        if (bestLag === -1) return { frequency: 0, confidence: 0 };

        const freq = sampleRate / bestLag;
        if (freq < 50 || freq > 2000) return { frequency: 0, confidence: 0 };

        return { frequency: freq, confidence: bestCorr };
    }
}

registerProcessor('pitch-processor', PitchProcessor);
