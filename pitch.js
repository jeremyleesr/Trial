<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Piano Pitch Test</title>

<style>
  body {
    margin: 0;
    background: #000;
    color: #0f0;
    font-family: monospace;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }

  #container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  canvas {
    border: 2px solid #333;
    background: #000;
  }

  button {
    margin-top: 16px;
    padding: 14px 24px;
    font-size: 18px;
    background: #0f0;
    color: #000;
    border: none;
    border-radius: 8px;
    font-weight: bold;
  }

  #status {
    margin-top: 10px;
    color: #0f0;
  }
</style>
</head>

<body>
<div id="container">
  <canvas id="canvas" width="700" height="260"></canvas>
  <button id="startBtn">Start</button>
  <div id="status">Idle</div>
</div>

<script src="pitch.js"></script>
</body>
</html>
