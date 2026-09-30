const VISION_VERSION = '0.10.21';
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VERSION}/wasm`;
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export const HOLD_MS = 700;
export const FRAME_HINT = 'Я тебя не вижу целиком. Отойди чуть дальше.';
export const HIGHER_HINT = 'Подними руку выше';
export const BOTH_ARMS_HINT = 'Подними обе руки';
export const OTHER_ARM_HINT = 'Опусти другую руку';
export const HOLD_HINT = 'Вот так, держи ещё немного';
export const WRONG_RIGHT_HINT = 'Это правая рука, а нужна левая';
export const WRONG_LEFT_HINT = 'Это левая рука, а нужна правая';
export const BALANCE_HOLD_MS = 6000;
export const ARMS_OUT_HINT = 'Разведи руки в стороны';
export const ARMS_STRAIGHT_HINT = 'Держи руки ровнее';
export const SWAY_HINT = 'Старайся не шататься';
export const LIFT_FOOT_HINT = 'Подними ногу чуть выше';

const LEFT_KNEE = 25;
const RIGHT_KNEE = 26;
const LEFT_ANKLE = 27;
const RIGHT_ANKLE = 28;

const NOSE = 0;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_ELBOW = 13;
const RIGHT_ELBOW = 14;
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

function visible(point, confidence = 0.35) {
  return Boolean(point) && (point.visibility ?? 1) >= confidence;
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

function armRaised(shoulder, elbow, wrist, hip) {
  if (!visible(shoulder) || !visible(elbow, 0.4) || !visible(wrist, 0.45) || !visible(hip)) return false;
  const torsoHeight = Math.max(0.12, hip.y - shoulder.y);
  const elbowUp = elbow.y < shoulder.y - torsoHeight * 0.16;
  const wristUp = wrist.y < elbow.y - torsoHeight * 0.12;
  return elbowUp && wristUp;
}

function armTrying(shoulder, wrist, hip) {
  if (!visible(shoulder) || !visible(wrist, 0.4)) return false;
  const torsoHeight = Math.max(0.12, visible(hip) ? hip.y - shoulder.y : 0.22);
  return wrist.y < shoulder.y + torsoHeight * 0.08;
}

const motion = [];

export function resetBalanceMotion() {
  motion.length = 0;
}

export function trackBalanceMotion(landmarks, now) {
  const leftShoulder = landmarks?.[LEFT_SHOULDER];
  const rightShoulder = landmarks?.[RIGHT_SHOULDER];
  const leftHip = landmarks?.[LEFT_HIP];
  const rightHip = landmarks?.[RIGHT_HIP];
  if (!visible(leftShoulder) || !visible(rightShoulder) || !visible(leftHip) || !visible(rightHip)) return false;
  const centerX = (leftShoulder.x + rightShoulder.x) / 2;
  motion.push({
    now,
    centerX,
    tilt: leftShoulder.y - rightShoulder.y,
    lean: centerX - (leftHip.x + rightHip.x) / 2,
  });
  while (motion.length && now - motion[0].now > 800) motion.shift();
  if (motion.length < 5) return false;
  const centers = motion.map((item) => item.centerX);
  const range = Math.max(...centers) - Math.min(...centers);
  const tilt = Math.max(...motion.map((item) => Math.abs(item.tilt)));
  const lean = Math.max(...motion.map((item) => Math.abs(item.lean)));
  return range > 0.07 || tilt > 0.085 || lean > 0.075;
}

function torsoHeightOf(landmarks) {
  const shoulderY = (landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2;
  const hipY = (landmarks[LEFT_HIP].y + landmarks[RIGHT_HIP].y) / 2;
  return Math.max(0.12, hipY - shoulderY);
}

function armSide(shoulder, elbow, wrist, torsoHeight) {
  if (!visible(shoulder) || !visible(elbow, 0.35) || !visible(wrist, 0.4)) return 'down';
  const reach = Math.abs(wrist.x - shoulder.x);
  const level = Math.abs(wrist.y - shoulder.y);
  const elbowDrop = elbow.y - Math.min(shoulder.y, wrist.y);
  if (reach < torsoHeight * 0.5 || level > torsoHeight * 0.62) return 'down';
  if (level > torsoHeight * 0.32 || elbowDrop > torsoHeight * 0.26) return 'crooked';
  return 'ok';
}

function armOverhead(shoulder, elbow, wrist, torsoHeight) {
  if (!visible(shoulder) || !visible(elbow, 0.35) || !visible(wrist, 0.4)) return false;
  return elbow.y < shoulder.y - torsoHeight * 0.04 && wrist.y < shoulder.y - torsoHeight * 0.3;
}

function armsMessage(left, right) {
  if (left === 'down' || right === 'down') return ARMS_OUT_HINT;
  if (left === 'crooked' || right === 'crooked') return ARMS_STRAIGHT_HINT;
  return '';
}

function hardArmMessage(armIsUp, sideState, upIsLeft) {
  const upName = upIsLeft ? 'Левую' : 'Правую';
  const sideName = upIsLeft ? 'Правую' : 'Левую';
  if (!armIsUp) return `${upName} руку подними вверх`;
  if (sideState === 'down') return `${sideName} руку держи в сторону`;
  if (sideState === 'crooked') return `${sideName} руку держи горизонтально`;
  return '';
}

function liftedLeg(landmarks, side, torsoHeight) {
  const ankle = landmarks[side === 'left' ? LEFT_ANKLE : RIGHT_ANKLE];
  const otherAnkle = landmarks[side === 'left' ? RIGHT_ANKLE : LEFT_ANKLE];
  const knee = landmarks[side === 'left' ? LEFT_KNEE : RIGHT_KNEE];
  const otherKnee = landmarks[side === 'left' ? RIGHT_KNEE : LEFT_KNEE];
  if (!visible(ankle, 0.3) || !visible(otherAnkle, 0.3)) return 'hidden';
  const gap = otherAnkle.y - ankle.y;
  if (gap < torsoHeight * 0.12) return 'down';
  if (gap < torsoHeight * 0.28) return 'low';
  if (visible(knee, 0.3) && visible(otherKnee, 0.3) && knee.y > otherKnee.y - torsoHeight * 0.02) return 'low';
  return 'up';
}

function footMessage(state, support) {
  if (state === 'hidden') return 'Отойди чуть дальше, чтобы было видно ступни.';
  if (state === 'low') return LIFT_FOOT_HINT;
  if (state !== 'up') return support === 'right' ? 'Стой на правой ноге, левую подними' : 'Стой на левой ноге, правую подними';
  return '';
}

function balancePose(landmarks, pose, swaying) {
  const torsoHeight = torsoHeightOf(landmarks);
  const leftSide = armSide(landmarks[LEFT_SHOULDER], landmarks[LEFT_ELBOW], landmarks[LEFT_WRIST], torsoHeight);
  const rightSide = armSide(landmarks[RIGHT_SHOULDER], landmarks[RIGHT_ELBOW], landmarks[RIGHT_WRIST], torsoHeight);
  if (pose === 'airplane') {
    const arms = armsMessage(leftSide, rightSide);
    if (arms) return { ok: false, message: arms };
  } else if (pose === 'one-leg-right' || pose === 'one-leg-left') {
    const support = pose === 'one-leg-right' ? 'right' : 'left';
    const foot = footMessage(liftedLeg(landmarks, support === 'right' ? 'left' : 'right', torsoHeight), support);
    if (foot) return { ok: false, message: foot };
    const arms = armsMessage(leftSide, rightSide);
    if (arms) return { ok: false, message: arms };
  } else if (pose === 'balance-right' || pose === 'balance-left') {
    const support = pose === 'balance-right' ? 'right' : 'left';
    const foot = footMessage(liftedLeg(landmarks, support === 'right' ? 'left' : 'right', torsoHeight), support);
    if (foot) return { ok: false, message: foot };
    const upIsLeft = pose === 'balance-right';
    const armIsUp = armOverhead(
      landmarks[upIsLeft ? LEFT_SHOULDER : RIGHT_SHOULDER],
      landmarks[upIsLeft ? LEFT_ELBOW : RIGHT_ELBOW],
      landmarks[upIsLeft ? LEFT_WRIST : RIGHT_WRIST],
      torsoHeight,
    );
    const sideState = upIsLeft ? rightSide : leftSide;
    const arms = hardArmMessage(armIsUp, sideState, upIsLeft);
    if (arms) return { ok: false, message: arms };
  }

  if (swaying) return { ok: false, message: SWAY_HINT };
  return { ok: true, message: 'Вот так, держи ровно' };
}

function wrongSideMessage(pose) {
  return pose === 'left-arm' ? WRONG_RIGHT_HINT : WRONG_LEFT_HINT;
}

function singleArm(landmarks, pose) {
  const left = pose === 'left-arm';
  const shoulder = landmarks[left ? LEFT_SHOULDER : RIGHT_SHOULDER];
  const elbow = landmarks[left ? LEFT_ELBOW : RIGHT_ELBOW];
  const wrist = landmarks[left ? LEFT_WRIST : RIGHT_WRIST];
  const hip = landmarks[left ? LEFT_HIP : RIGHT_HIP];
  const otherShoulder = landmarks[left ? RIGHT_SHOULDER : LEFT_SHOULDER];
  const otherElbow = landmarks[left ? RIGHT_ELBOW : LEFT_ELBOW];
  const otherWrist = landmarks[left ? RIGHT_WRIST : LEFT_WRIST];
  const otherHip = landmarks[left ? RIGHT_HIP : LEFT_HIP];
  const targetUp = armRaised(shoulder, elbow, wrist, hip);
  const otherUp = armRaised(otherShoulder, otherElbow, otherWrist, otherHip);
  const otherTrying = armTrying(otherShoulder, otherWrist, otherHip);

  if (!targetUp && (otherUp || otherTrying)) return { ok: false, message: wrongSideMessage(pose) };
  if (!targetUp) return { ok: false, message: HIGHER_HINT };
  if (otherUp) return { ok: false, message: OTHER_ARM_HINT };
  return { ok: true, message: HOLD_HINT };
}

function bothArms(landmarks) {
  const leftUp = armRaised(landmarks[LEFT_SHOULDER], landmarks[LEFT_ELBOW], landmarks[LEFT_WRIST], landmarks[LEFT_HIP]);
  const rightUp = armRaised(landmarks[RIGHT_SHOULDER], landmarks[RIGHT_ELBOW], landmarks[RIGHT_WRIST], landmarks[RIGHT_HIP]);
  if (leftUp && rightUp) return { ok: true, message: HOLD_HINT };
  const leftOn = leftUp || armTrying(landmarks[LEFT_SHOULDER], landmarks[LEFT_WRIST], landmarks[LEFT_HIP]);
  const rightOn = rightUp || armTrying(landmarks[RIGHT_SHOULDER], landmarks[RIGHT_WRIST], landmarks[RIGHT_HIP]);
  if (leftOn !== rightOn) return { ok: false, message: BOTH_ARMS_HINT };
  return { ok: false, message: leftOn ? HIGHER_HINT : BOTH_ARMS_HINT };
}

const BALANCE_POSES = new Set(['airplane', 'one-leg-right', 'one-leg-left', 'balance-right', 'balance-left']);

export function evaluatePose(landmarks, pose, { swaying = false } = {}) {
  if (!bodyInFrame(landmarks)) return { ok: false, message: FRAME_HINT };
  if (BALANCE_POSES.has(pose)) return balancePose(landmarks, pose, swaying);
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
