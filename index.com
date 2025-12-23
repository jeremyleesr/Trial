<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
/>
<title>Visual Grand Staff – Foundation</title>

<style>
  html, body {
    margin: 0;
    padding: 0;
    background: #0b2b1c;
    color: #e8f5ee;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    overflow: hidden;
  }

  /* Portrait lock */
  #rotate-warning {
    position: fixed;
    inset: 0;
    background: #0b2b1c;
    color: #e8f5ee;
    display: none;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 1.2rem;
    z-index: 999;
  }

  #ui {
    padding: 12px;
  }

  button {
    background: #2ecc71;
    border: none;
    color: #003b1f;
    padding: 10px 18px;
    font-size: 1rem;
    border-radius: 10px;
    font-weight: 600;
  }

  /* STAFF IS PERMANENT */
  #staff-container {
    width: 100vw;
    height: 25vh;
    background: white;
    position: relative;
  }

  canvas {
    display: block;
  }
</style>
</head>

<body>

<div id="rotate-warning">
  <div>Please rotate your device to landscape.</div>
</div>

<div id="ui">
  <button id="startBtn">Start</button>
  <div>Foundation v1.8.1 — visual only (pitch stubbed)</div>
</div>

<div id="staff-container">
  <canvas id="staffCanvas"></canvas>
</div>

<script>
/* ===========================
   LANDSCAPE LOCK
=========================== */
function enforceLandscape() {
  const landscape = window.innerWidth > window.innerHeight;
  document.getElementById("rotate-warning").style.display =
    landscape ? "none" : "flex";
}
window.addEventListener("resize", enforceLandscape);
enforceLandscape();

/* ===========================
   CANVAS (LOCKED GEOMETRY)
=========================== */
const canvas = document.getElementById("staffCanvas");
const ctx = canvas.getContext("2d");

function setupCanvas() {
  canvas.width = window.innerWidth;
  canvas.height =
    document.getElementById("staff-container").clientHeight;
}
setupCanvas();

/* ===========================
   STAFF GEOMETRY (FIXED)
=========================== */
const STAFF_LINES = 5;
let staffTop = 0;
let lineSpacing = 0;

function computeStaff() {
  lineSpacing = canvas.height / 8;
  staffTop =
    canvas.height / 2 -
    ((STAFF_LINES - 1) * lineSpacing) / 2;
}
computeStaff();

/* ===========================
   NOTE MODEL (VISUAL ONLY)
=========================== */
/*
 pitch = 0 → middle line
 +1 = up one space
 -1 = down one space
*/
const notes = [
  { pitch: -3, x: canvas.width + 100 },
  { pitch: 0,  x: canvas.width + 320 },
  { pitch: 4,  x: canvas.width + 540 }
];

const NOTE_SPEED = 1.25;
const NOTE_RADIUS = () => lineSpacing * 0.4;

/* ===========================
   DRAWING
=========================== */
function drawStaff() {
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.2;

  for (let i = 0; i < STAFF_LINES; i++) {
    const y = staffTop + i * lineSpacing;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawLedgerLines(pitch, x) {
  const limit = 2;
  if (Math.abs(pitch) <= limit) return;

  const steps = Math.abs(pitch) - limit;
  const dir = pitch > 0 ? -1 : 1;

  for (let i = 0; i < steps; i++) {
    const y =
      staffTop +
      ((STAFF_LINES - 1) * lineSpacing) / 2 +
      dir * (limit + i + 1) * (lineSpacing / 2);

    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.lineTo(x + 12, y);
    ctx.stroke();
  }
}

function drawNote(note) {
  const centerY =
    staffTop +
    ((STAFF_LINES - 1) * lineSpacing) / 2 -
    note.pitch * (lineSpacing / 2);

  drawLedgerLines(note.pitch, note.x);

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(
    note.x,
    centerY,
    NOTE_RADIUS(),
    NOTE_RADIUS() * 0.75,
    -0.4,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function drawHitZone() {
  const width = 60;
  const x = canvas.width / 2 - width / 2;
  ctx.fillStyle = "rgba(0, 200, 120, 0.25)";
  ctx.fillRect(x, 0, width, canvas.height);
}

/* ===========================
   PITCH DETECTION — STUB
=========================== */
/*
  Intentionally disabled.
  This preserves structure so future
  pitch logic drops in cleanly.
*/
let currentPitchHz = null;
function updatePitchStub() {
  currentPitchHz = null;
}

/* ===========================
   MAIN LOOP
=========================== */
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawHitZone();
  drawStaff();

  notes.forEach(note => {
    note.x -= NOTE_SPEED;
    if (note.x < -60) {
      note.x = canvas.width + Math.random() * 400;
    }
    drawNote(note);
  });

  updatePitchStub();
  requestAnimationFrame(loop);
}

loop();
</script>

</body>
</html>
