const ROTATE_RATE = 4;
const SHIP_RADIUS = 40;
const LINE_WIDTH = 2;
const SHIP_COLOR = '#ffffff';
const BG_COLOR = '#000000';

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
if (!canvas) throw new Error('missing #game canvas');
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('no 2d context');

const keys = new Set<string>();
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
  keys.add(e.key);
});
window.addEventListener('keyup', (e) => keys.delete(e.key));
window.addEventListener('blur', () => keys.clear());

function resize(): void {
  const dpr = window.devicePixelRatio || 1;
  canvas!.width = Math.floor(window.innerWidth * dpr);
  canvas!.height = Math.floor(window.innerHeight * dpr);
  ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
window.addEventListener('resize', resize);

let shipAngle = 0;
let lastT = performance.now();

function frame(nowT: number): void {
  const dt = Math.min((nowT - lastT) / 1000, 0.1);
  lastT = nowT;

  let dir = 0;
  if (keys.has('ArrowLeft')) dir -= 1;
  if (keys.has('ArrowRight')) dir += 1;
  shipAngle += dir * ROTATE_RATE * dt;

  const w = window.innerWidth;
  const h = window.innerHeight;
  ctx!.fillStyle = BG_COLOR;
  ctx!.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const nx = cx + Math.cos(shipAngle) * SHIP_RADIUS;
  const ny = cy + Math.sin(shipAngle) * SHIP_RADIUS;
  const lx = cx + Math.cos(shipAngle + 2.5) * SHIP_RADIUS * 0.7;
  const ly = cy + Math.sin(shipAngle + 2.5) * SHIP_RADIUS * 0.7;
  const rx = cx + Math.cos(shipAngle - 2.5) * SHIP_RADIUS * 0.7;
  const ry = cy + Math.sin(shipAngle - 2.5) * SHIP_RADIUS * 0.7;

  ctx!.strokeStyle = SHIP_COLOR;
  ctx!.lineWidth = LINE_WIDTH;
  ctx!.beginPath();
  ctx!.moveTo(nx, ny);
  ctx!.lineTo(lx, ly);
  ctx!.lineTo(rx, ry);
  ctx!.closePath();
  ctx!.stroke();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
