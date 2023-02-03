import 'aframe';
// const InterpolationBuffer = require('buffered-interpolation');
// const interpolationBuffer = new InterpolationBuffer();


const registerComponents = () => {
  console.log('Register a-frame components');

  AFRAME.registerComponent('emit-move', {
    schema: {
      interval: {type: 'int', default: 100},
    },
    position: '',
    lastEmit: Date.now(),
    firstEmitSent: false,
    finalEmitSent: false,
    emitPosition: function (position: string) {
      this.lastEmit = Date.now();
      this.el.emit('move', position);
    },
    tick: function () {
      const newPosition = AFRAME.utils.coordinates.stringify(this.el.object3D.position);
      // If entity has moved since last tick
      if (newPosition !== this.position) {
        this.position = newPosition;
        if(!this.firstEmitSent || Date.now() - this.lastEmit > this.data.interval){
          this.emitPosition(newPosition);
        }
        this.firstEmitSent = true,
        this.finalEmitSent = false;
      }
      // First tick after entity stopped moving
      else if(!this.finalEmitSent){
        this.emitPosition(newPosition);
        this.firstEmitSent = false;
        this.finalEmitSent = true;
      }
    },
  });

  AFRAME.registerComponent('remote-avatar', {
    schema: {
    },
    setPosition: function (position: string) {

    },
    init: function () {
      const el = this.el;
      this.el.addEventListener('moveTo', function (e) {
        // console.log(e.detail);
        // console.log(e.detail.position._rawValue);
        // interpolationBuffer.setPosition(new AFRAME.THREE.Vector3(e.detail.position._rawValue[0], e.detail.position._rawValue[1], e.detail.position._rawValue[2]));

        el.object3D.position.x = e.detail.position._rawValue[0];
        el.object3D.position.y = e.detail.position._rawValue[1];
        el.object3D.position.z = e.detail.position._rawValue[2];
      });
    },
  });

  // Nav mesh constraints
  AFRAME.registerComponent('simple-navmesh-constraint', {
    schema: {
      enabled: {
        default: true,
      },
      navmesh: {
        default: '',
      },
      fall: {
        default: 0.5,
      },
      height: {
        default: 1.6,
      },
      exclude: {
        default: '',
      },
      xzOrigin: {
        default: '',
      },
    },

    update: function () {
      this.lastPosition = null;
      this.excludes = this.data.exclude ? Array.from(document.querySelectorAll(this.data.exclude)):[];
      const els = Array.from(document.querySelectorAll(this.data.navmesh));
      if (els === null) {
        console.warn('navmesh-physics: Did not match any elements');
        this.objects = [];
      } else {
        this.objects = els.map(el => el.object3D).concat(this.excludes.map(el => el.object3D));
      }
      this.xzOrigin = this.data.xzOrigin ? this.el.querySelector(this.data.xzOrigin) : this.el;
    },

    tick: (function () {
      const nextPosition = new THREE.Vector3();
      const tempVec = new THREE.Vector3();
      const scanPattern = [
        [0,1], // Default the next location
        [0,0.5], // Check that the path to that location was fine
        [30,0.4], // A little to the side shorter range
        [-30,0.4], // A little to the side shorter range
        [60,0.2], // Moderately to the side short range
        [-60,0.2], // Moderately to the side short range
        [80,0.06], // Perpendicular very short range
        [-80,0.06], // Perpendicular very short range
      ];
      const down = new THREE.Vector3(0,-1,0);
      const raycaster = new THREE.Raycaster();
      const gravity = -1;
      const maxYVelocity = 0.5;
      const results = [];
      let yVel = 0;
      let firstTry = true;

      return function tick(time, delta) {
        if (this.data.enabled === false) return;
        if (this.lastPosition === null) {
          firstTry = true;
          this.lastPosition = new THREE.Vector3();
          this.xzOrigin.object3D.getWorldPosition(this.lastPosition);
          if (this.data.xzOrigin) this.lastPosition.y -= this.xzOrigin.object3D.position.y;
        }

        const el = this.el;
        if (this.objects.length === 0) return;

        this.xzOrigin.object3D.getWorldPosition(nextPosition);
        if (this.data.xzOrigin) nextPosition.y -= this.xzOrigin.object3D.position.y;
        if (nextPosition.distanceTo(this.lastPosition) <= 0.01) return;

        let didHit = false;
        // So that it does not get stuck it takes as few samples around the user and finds the most appropriate
        scanPatternLoop:
        for (const [angle, distance] of scanPattern) {
          tempVec.subVectors(nextPosition, this.lastPosition);
          tempVec.applyAxisAngle(down, angle*Math.PI/180);
          tempVec.multiplyScalar(distance);
          tempVec.add(this.lastPosition);
          tempVec.y += maxYVelocity;
          tempVec.y -= this.data.height;
          raycaster.set(tempVec, down);
          raycaster.far = this.data.fall > 0 ? this.data.fall + maxYVelocity : Infinity;
          raycaster.intersectObjects(this.objects, true, results);

          if (results.length) {
            // If it hit something we want to avoid then ignore it and stop looking
            for (const result of results) {
              if(this.excludes.includes(result.object.el)) {
                results.splice(0);
                continue scanPatternLoop;
              }
            }
            const hitPos = results[0].point;
            results.splice(0);
            hitPos.y += this.data.height;
            if (nextPosition.y - (hitPos.y - yVel*2) > 0.01) {
              yVel += Math.max(gravity * delta * 0.001, -maxYVelocity);
              hitPos.y = nextPosition.y + yVel;
            } else {
              yVel = 0;
            }
            tempVec.copy(hitPos);
            this.xzOrigin.object3D.parent.worldToLocal(tempVec);
            tempVec.sub(this.xzOrigin.object3D.position);
            if (this.data.xzOrigin) tempVec.y += this.xzOrigin.object3D.position.y;
            this.el.object3D.position.add(tempVec);

            this.lastPosition.copy(hitPos);
            didHit = true;
            break;
          }

        }

        if (didHit) {
          firstTry = false;
        }

        if (!firstTry && !didHit) {
          this.el.object3D.position.copy(this.lastPosition);
          this.el.object3D.parent.worldToLocal(this.el.object3D.position);
        }
      };
    }()),
  });



};

export default {
  registerAframeComponents: registerComponents,
};
