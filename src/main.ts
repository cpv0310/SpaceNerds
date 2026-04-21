import {
  engineInit,
  keyIsDown,
  drawLine,
  vec2,
  timeDelta,
  Color,
  setCanvasFixedSize,
  Vector2,
} from 'littlejsengine';

const ROTATE_RATE = 4;
const SHIP_RADIUS = 1.5;
const WHITE = new Color(1, 1, 1);
const LINE_WIDTH = 0.08;

let shipAngle = 0;

function gameInit(): void {
  setCanvasFixedSize(vec2(1280, 720));
}

function gameUpdate(): void {
  let dir = 0;
  if (keyIsDown('ArrowLeft')) dir -= 1;
  if (keyIsDown('ArrowRight')) dir += 1;
  shipAngle += dir * ROTATE_RATE * timeDelta;
}

function gameUpdatePost(): void {}

function gameRender(): void {
  const center = vec2(0, 0);
  const [a, b, c] = shipVertices(center, SHIP_RADIUS, shipAngle);
  drawLine(a, b, LINE_WIDTH, WHITE);
  drawLine(b, c, LINE_WIDTH, WHITE);
  drawLine(c, a, LINE_WIDTH, WHITE);
}

function gameRenderPost(): void {}

function shipVertices(
  center: Vector2,
  radius: number,
  angle: number,
): [Vector2, Vector2, Vector2] {
  const nose = center.add(vec2(Math.cos(angle) * radius, Math.sin(angle) * radius));
  const tailL = center.add(
    vec2(Math.cos(angle + 2.5) * radius * 0.7, Math.sin(angle + 2.5) * radius * 0.7),
  );
  const tailR = center.add(
    vec2(Math.cos(angle - 2.5) * radius * 0.7, Math.sin(angle - 2.5) * radius * 0.7),
  );
  return [nose, tailL, tailR];
}

void engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
