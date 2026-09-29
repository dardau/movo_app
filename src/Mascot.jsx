import './mascot.css';

const PARTS = {
  body: '/assets/mascot/mascot_body.png',
  head: '/assets/mascot/mascot_head.png',
  leftArm: '/assets/mascot/mascot_left_arm.png',
  rightArm: '/assets/mascot/mascot_right_arm.png',
};

export function Mascot({ state = 'idle' }) {
  const pose = ['idle', 'raiseLeft', 'raiseRight', 'bothHands', 'success', 'error'].includes(state) ? state : 'idle';
  return (
    <div className={`movo-mascot is-${pose}`} aria-hidden="true">
      <div className="movo-bob">
        <div className="movo-sway">
          <div className="movo-arm-slot movo-arm-right">
            <img className="movo-arm" src={PARTS.rightArm} alt="" />
          </div>
          <div className="movo-arm-slot movo-arm-left">
            <img className="movo-arm" src={PARTS.leftArm} alt="" />
          </div>
          <img className="movo-body" src={PARTS.body} alt="" />
          <div className="movo-head-slot">
            <img className="movo-head" src={PARTS.head} alt="" />
          </div>
        </div>
      </div>
    </div>
  );
}
