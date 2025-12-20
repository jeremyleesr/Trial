class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(2048);
    this.index = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const data = input[0];

    for (let i = 0; i < data.length; i++) {
      this.buffer[this.index++] = data[i];

      if (this.index >= this.buffer.length) {
        const rms = this.computeRMS(this.buffer);
        let freq = 0;

        if (rms > 0.02) {
          freq = this.autoCorrelate(this.buffer, sampleRate);
        }

        this.port.postMessage({
          frequency: freq,
          rms
        });

        this.index = 0;
      }
    }
    return true;
  }

  computeRMS(buf) {
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    return Math.sqrt(sum / buf.length);
  }

  autoCorrelate(buf, sampleRate) {
    let bestLag = -1;
    let bestCorr = 0;

    for (let lag = 50; lag < 1000; lag++) {
      let sum = 0;
      for (let i = 0; i < buf.length - lag; i++) {
        sum += buf[i] * buf[i + lag];
      }
      if (sum > bestCorr) {
        bestCorr = sum;
        bestLag = lag;
      }
    }

    return bestLag > 0 ? sampleRate / bestLag : 0;
  }
}

registerProcessor("pitch-processor", PitchProcessor);
