const VISION_VERSION = '0.10.21';
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VERSION}/wasm`;
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export const HOLD_MS = 700;
export const FRAME_HINT = 'Я тебя не вижу целиком. Отойди чуть дальше.';
export const HIGHER_HINT = 'Подними руку выше';
export const OTHER_ARM_HINT = 'Опусти другую руку';
export const HOLD_HINT = 'Вот так, держи ещё немного';
export const WRONG_RIGHT_HINT = 'Это правая рука, а нужна левая';
export const WRONG_LEFT_HINT = 'Это левая рука, а нужна правая';

const NOSE = 0;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;

const BONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
];

const DOTS = [0, 11, 12, 13, 14, 15, 16, 23, 24];

function visible(point) {
  return Boolean(point) && (point.visibility ?? 1) >= 0.35;
}

export function bodyInFrame(landmarks) {
  if (!landmarks || landmarks.length < 25) return false;
  const needed = [NOSE, LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP];
  if (!needed.every((index) => visible(landmarks[index]))) return false;
  const nose = landmarks[NOSE];
  const shoulderY = (landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2;
  const hipY = (landmarks[LEFT_HIP].y + landmarks[RIGHT_HIP].y) / 2;
  if (nose.y < 0.02 || nose.y > 0.62) return false;
  if (hipY - shoulderY < 0.1) return false;
  if (hipY > 0.98) return false;
  return true;
}

export function frameStatus(landmarks) {
  if (!bodyInFrame(landmarks)) return { ok: false, message: FRAME_HINT };
  return { ok: true, message: 'Отлично, тебя видно целиком' };
}

function wristAboveShoulder(shoulder, wrist) {
  return visible(shoulder) && visible(wrist) && wrist.y < shoulder.y - 0.02;
}

function wrongSideMessage(pose) {
  return pose === 'left-arm' ? WRONG_RIGHT_HINT : WRONG_LEFT_HINT;
}

function singleArm(landmarks, pose) {
  const left = pose === 'left-arm';
  const shoulder = landmarks[left ? LEFT_SHOULDER : RIGHT_SHOULDER];
  const wrist = landmarks[left ? LEFT_WRIST : RIGHT_WRIST];
  const otherShoulder = landmarks[left ? RIGHT_SHOULDER : LEFT_SHOULDER];
  const otherWrist = landmarks[left ? RIGHT_WRIST : LEFT_WRIST];
  const targetUp = wristAboveShoulder(shoulder, wrist);
  const otherUp = visible(otherWrist) && wristAboveShoulder(otherShoulder, otherWrist);

  if (!targetUp && otherUp) return { ok: false, message: wrongSideMessage(pose) };
  if (!targetUp) return { ok: false, message: HIGHER_HINT };
  if (otherUp) return { ok: false, message: OTHER_ARM_HINT };
  return { ok: true, message: HOLD_HINT };
}

function bothArms(landmarks) {
  const leftUp = wristAboveShoulder(landmarks[LEFT_SHOULDER], landmarks[LEFT_WRIST]);
  const rightUp = wristAboveShoulder(landmarks[RIGHT_SHOULDER], landmarks[RIGHT_WRIST]);
  if (!leftUp || !rightUp) return { ok: false, message: HIGHER_HINT };
  return { ok: true, message: HOLD_HINT };
}

export function evaluatePose(landmarks, pose) {
  if (!bodyInFrame(landmarks)) return { ok: false, message: FRAME_HINT };
  if (pose === 'both-arms') return bothArms(landmarks);
  if (pose === 'left-arm' || pose === 'right-arm') return singleArm(landmarks, pose);
  return { ok: false, message: HIGHER_HINT };
}

export function drawPose(canvas, landmarks, video, { error = false } = {}) {
  if (!canvas || !video) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.clientWidth;
  const height = rect.height || canvas.clientHeight;
  if (!width || !height) return;
  const dpr = window.devicePixelRatio || 1;
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  if (!landmarks) return;

  const videoWidth = video.videoWidth || width;
  const videoHeight = video.videoHeight || height;
  const scale = Math.max(width / videoWidth, height / videoHeight);
  const drawnWidth = videoWidth * scale;
  const drawnHeight = videoHeight * scale;
  const offsetX = (width - drawnWidth) / 2;
  const offsetY = (height - drawnHeight) / 2;
  const point = (landmark) => ({
    x: offsetX + landmark.x * drawnWidth,
    y: offsetY + landmark.y * drawnHeight,
  });

  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = error ? '#ff8d8d' : '#7ed957';
  ctx.fillStyle = error ? '#ffd0d0' : '#e9ffd4';
  for (const [start, end] of BONES) {
    const from = landmarks[start];
    const to = landmarks[end];
    if (!from || !to) continue;
    const a = point(from);
    const b = point(to);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  for (const index of DOTS) {
    const landmark = landmarks[index];
    if (!landmark) continue;
    const spot = point(landmark);
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, index === NOSE ? 6 : 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export async function createPoseLandmarker() {
  const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
  const options = (delegate) => ({
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: 'VIDEO',
    numPoses: 1,
  });
  try {
    return await PoseLandmarker.createFromOptions(vision, options('GPU'));
  } catch {
    return PoseLandmarker.createFromOptions(vision, options('CPU'));
  }
}
