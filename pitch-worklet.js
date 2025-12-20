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

    let hz = null;
    if (rms > 0.01) {
      hz = this.autoCorrelate(buf, sampleRate);
    }

    this.port.postMessage({ hz });
    return true;
  }

  autoCorrelate(buf, sampleRate) {
    let bestOffset = -1;
    let bestCorr = 0;
    const size = buf.length;
    const max = Math.floor(size / 2);

    for (let offset = 20; offset < max; offset++) {
      let corr = 0;
      for (let i = 0; i < max; i++) {
        corr += buf[i] * buf[i + offset];
      }
      if (corr > bestCorr) {
        bestCorr = corr;
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
