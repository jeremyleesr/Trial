class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(2048);
    this.index = 0;
  }

  process(inputs) {
    const input = inputs[0][0];
    if (!input) return true;

    for (let i = 0; i < input.length; i++) {
      this.buffer[this.index++] = input[i];
      if (this.index >= this.buffer.length) {
        this.detect();
        this.index = 0;
      }
    }
    return true;
  }

  detect() {
    let rms = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      rms += this.buffer[i] * this.buffer[i];
    }
    rms = Math.sqrt(rms / this.buffer.length);

    if (rms < 0.005) {
      this.port.postMessage({ pitch: null, rms });
      return;
    }

    const pitch = this.autoCorrelate(this.buffer, sampleRate);
    this.port.postMessage({ pitch, rms });
  }

  autoCorrelate(buf, sampleRate) {
    let bestOffset = -1;
    let bestCorrelation = 0;
    const size = buf.length;

    for (let offset = 20; offset < 1000; offset++) {
      let correlation = 0;
      for (let i = 0; i < size - offset; i++) {
        correlation += buf[i] * buf[i + offset];
      }
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    if (bestOffset > 0) {
      return sampleRate / bestOffset;
    }
    return null;
  }
}

registerProcessor("pitch-processor", PitchProcessor);
