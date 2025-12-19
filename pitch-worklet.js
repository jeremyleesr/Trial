class PitchWorklet extends AudioWorkletProcessor {
    process(inputs) {
        const input = inputs[0];
        if (!input || !input[0]) {
            this.port.postMessage({ alive: true, rms: 0 });
            return true;
        }

        const channel = input[0];
        let rms = 0;
        for (let i = 0; i < channel.length; i++) {
            rms += channel[i] * channel[i];
        }
        rms = Math.sqrt(rms / channel.length);

        // HEARTBEAT — proves audio is flowing
        this.port.postMessage({
            alive: true,
            rms
        });

        return true;
    }
}

registerProcessor("pitch-worklet", PitchWorklet);
