class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const buffer = input[0];
    let rms = 0;

    for (let i = 0; i < buffer.length; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / buffer.length);

    let hz = null;
    if (rms > 0.01) {
      hz = this.autoCorrelate(buffer, sampleRate);
    }

    this.port.postMessage({ hz, rms });
    return true;
  }

  autoCorrelate(buffer, sampleRate) {
    let SIZE = buffer.length;
    let maxSamples = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;

    for (let offset = 20; offset < maxSamples; offset++) {
      let correlation = 0;
      for (let i = 0; i < maxSamples; i++) {
        correlation += buffer[i] * buffer[i + offset];
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
