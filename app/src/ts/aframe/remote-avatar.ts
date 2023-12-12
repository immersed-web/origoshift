import type { DetailEvent, Entity } from 'aframe';
import InterpolationBuffer from 'buffered-interpolation';
import type { ClientTransform } from 'schemas';

export default () => {

  AFRAME.registerComponent('remote-avatar', {

    // Component schema (incoming properties)
    schema: {
      interpolationTime: { type: 'number', default: 500 },
      nearRangeThreshold: { type: 'number', default: 7 },
      nearRangeHysteresis: { type: 'number', default: 4 },
    },
    // dependencies: ['position', 'orientation'],

    // Component variables
    interpolationBuffer: undefined as InterpolationBuffer | undefined,
    cameraPosition: new AFRAME.THREE.Vector3(),
    distance: 1000,
    isNearRange: false,
    distanceDebugEntity: undefined as Entity | undefined,

    // Component a-frame callbacks
    init: function () {
      // console.log('Remote avatar init', this.data.id);
      this.initInterpolationBuffer();
      const pos = this.el.object3D.position.clone();
      this.interpolationBuffer?.setPosition(pos);
      const rot = this.el.object3D.quaternion.clone();
      this.interpolationBuffer?.setQuaternion(rot);
      
      const foundEl = this.el.querySelector('.distance-debug');
      if(foundEl) {
        this.distanceDebugEntity = foundEl as Entity;
      }
      
      console.log('Remote avatar initialized');
    },
    tick: function (time, timeDelta) {

      if(this.interpolationBuffer){
        // Interpolate with buffered-interpolation - no workie yet.
        this.el.object3D.position.copy(this.interpolationBuffer.getPosition());
        this.el.object3D.quaternion.copy(this.interpolationBuffer.getQuaternion());

        // update buffer position
        this.interpolationBuffer.update(timeDelta);
      }
      this.distanceToCamera();
      if(this.distanceDebugEntity){
        this.distanceDebugEntity.setAttribute('value', `${this.distance.toFixed(2)}`);
      }
    },
    events: {
      // setTransform: function(e: DetailEvent<ClientTransform>) {
      //   console.log('remote-avatar event: setTransform', e);
      //   const trsfm = e.detail;
      //   const interpolationBuffer = this.interpolationBuffer!;
      //   interpolationBuffer.setPosition(new AFRAME.THREE.Vector3(...trsfm.position));
      //   interpolationBuffer.setQuaternion(new AFRAME.THREE.Quaternion(...trsfm.orientation));
      //   interpolationBuffer.updateOriginFrameToBufferTail();
      // },
      moveTo: function (e: DetailEvent<Pick<ClientTransform, 'position'>>) {
        // // Interpolate with buffered-interpolation
        // console.log('Move to',e);
        const pos = e.detail.position;
        this.interpolationBuffer!.setPosition(new AFRAME.THREE.Vector3(pos[0], pos[1], pos[2]));
      },

      rotateTo: function (e: DetailEvent<Pick<ClientTransform, 'orientation'>>) {
        // // Interpolate with buffered-interpolation
        // console.log('Rotate to',e);
        const rot = e.detail.orientation;
        this.interpolationBuffer!.setQuaternion(new AFRAME.THREE.Quaternion(rot[0], rot[1], rot[2], rot[3]));
      },
    },

    // Component functions
    initInterpolationBuffer: function () {
      this.interpolationBuffer = new InterpolationBuffer(undefined, this.data.interpolationTime / 1000);
    },
    distanceToCamera: function () {
      // const distanceOld = this.distance;
      // Note: calculating distance between LOCAL position vectors, not taking into account the world position.
      // This should be fine as long as the camera and the avatars share the same origin position.
      const camera = this.el.sceneEl?.camera;
      if(!camera) return;
      const camWorldPos = camera.getWorldPosition(new THREE.Vector3());
      const avatarWorldPos = this.el.object3D.getWorldPosition(new THREE.Vector3());
      this.distance = avatarWorldPos.distanceTo(camWorldPos);
      const threshold = this.data.nearRangeThreshold as number;
      const hysteresis = this.data.nearRangeHysteresis as number;
      if(!this.isNearRange && this.distance <= threshold){
        this.isNearRange = true;
        // console.log('I am close', this.el);
        this.el.emit('near-range-entered', this.distance);
      }
      else if(this.isNearRange && this.distance > threshold + hysteresis){
        this.isNearRange = false;
        // console.log('No longer close', this.el);
        this.el.emit('near-range-exited', this.distance);
      }
    },
  });

};
