const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const statusEl = document.getElementById("status");

let audioCtx;
let analyser;
let data;
let running = false;

startBtn.onclick = async () => {
  if (running) return;
  running = true;

  try {
    statusEl.textContent = "Requesting mic…";

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // 🔑 REQUIRED ON iOS
    await audioCtx.resume();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    const source = audioCtx.createMediaStreamSource(stream);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;

    source.connect(analyser);
    data = new Float32Array(analyser.fftSize);

    statusEl.textContent = "Listening…";
    draw();

  } catch (err) {
    console.error(err);
    statusEl.textContent = "Mic error";
    alert("Microphone permission failed.\nCheck Safari Settings → Microphone.");
    running = false;
  }
};

function autoCorrelate(buffer, sampleRate) {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.01) return null;

  let bestOffset = -1;
  let bestCorrelation = 0;

  for (let offset = 20; offset < 1000; offset++) {
    let correlation = 0;
    for (let i = 0; i < buffer.length - offset; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestOffset === -1) return null;
  return sampleRate / bestOffset;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0f0";
  ctx.font = "22px monospace";

  analyser.getFloatTimeDomainData(data);
  const pitch = autoCorrelate(data, audioCtx.sampleRate);

  if (pitch) {
    ctx.fillText(`Pitch: ${pitch.toFixed(1)} Hz`, 20, 40);
  } else {
    ctx.fillText("Listening… (no signal)", 20, 40);
  }

  requestAnimationFrame(draw);
}
