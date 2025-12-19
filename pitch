const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");

let audioCtx;
let analyser;
let data;
let running = false;

async function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false
    }
  });

  const source = audioCtx.createMediaStreamSource(stream);

  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 4096; // larger buffer for piano

  data = new Float32Array(analyser.fftSize);

  source.connect(analyser);
}

function autoCorrelate(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    rms += buf[i] * buf[i];
  }
  rms = Math.sqrt(rms / SIZE);

  // Lower gate for piano
  if (rms < 0.008) return -1;

  let bestOffset = -1;
  let bestCorrelation = 0;

  for (let offset = 20; offset < SIZE / 2; offset++) {
    let correlation = 0;

    for (let i = 0; i < SIZE - offset; i++) {
      correlation += buf[i] * buf[i + offset];
    }

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestOffset === -1) return -1;

  const freq = sampleRate / bestOffset;

  // Reject impossible piano values
  if (freq < 40 || freq > 2000) return -1;

  return freq;
}

function draw() {
  if (!running) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  analyser.getFloatTimeDomainData(data);
  const freq = autoCorrelate(data, audioCtx.sampleRate);

  ctx.fillStyle = "#0f0";
  ctx.font = "20px monospace";

  if (freq === -1) {
    ctx.fillText("Listening… (no signal)", 20, 40);
  } else {
    ctx.fillText(`Pitch: ${freq.toFixed(1)} Hz`, 20, 40);
  }

  requestAnimationFrame(draw);
}

startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  startBtn.textContent = "Listening…";

  await initAudio();
  running = true;
  requestAnimationFrame(draw);
});
