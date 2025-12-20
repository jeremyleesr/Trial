class PitchProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const buf = input[0];
    let rms = 0;
    for (let i = 0; i < buf.length; i++) {
      rms += buf[i] * buf[i];
    }
    rms = Math.sqrt(rms / buf.length);

    if (rms < 0.01) return true;

    // Auto-correlation pitch detection
    let bestOffset = -1;
    let bestCorrelation = 0;

    for (let offset = 20; offset < 1000; offset++) {
      let corr = 0;
      for (let i = 0; i < buf.length - offset; i++) {
        corr += buf[i] * buf[i + offset];
      }
      if (corr > bestCorrelation) {
        bestCorrelation = corr;
        bestOffset = offset;
      }
    }

    if (bestOffset > 0) {
      const freq = sampleRate / bestOffset;
      this.port.postMessage({ freq, rms });
    }

    return true;
  }
}

registerProcessor("pitch-processor", PitchProcessor);
