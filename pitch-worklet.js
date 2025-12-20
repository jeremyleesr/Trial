// pitch-worklet.js
class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(2048);
    this.bufferIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channel = input[0];

    for (let i = 0; i < channel.length; i++) {
      this.buffer[this.bufferIndex++] = channel[i];

      if (this.bufferIndex >= this.buffer.length) {
        const { freq, rms } = this.detectPitch(this.buffer, sampleRate);
        this.port.postMessage({ freq, rms });
        this.bufferIndex = 0;
      }
    }
    return true;
  }

  detectPitch(buf, sampleRate) {
    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / buf.length);
    if (rms < 0.01) return { freq: null, rms };

    let bestOffset = -1;
    let bestCorr = 0;

    for (let offset = 20; offset < 1000; offset++) {
      let corr = 0;
      for (let i = 0; i < 1024; i++) {
        corr += buf[i] * buf[i + offset];
      }
      if (corr > bestCorr) {
        bestCorr = corr;
        bestOffset = offset;
      }
    }

    if (bestOffset === -1) return { freq: null, rms };
    return { freq: sampleRate / bestOffset, rms };
  }
}

registerProcessor("pitch-processor", PitchProcessor);
