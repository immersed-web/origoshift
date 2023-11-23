import 'aframe';
import type { DetailEvent } from 'aframe';
import InterpolationBuffer from 'buffered-interpolation';

export default () => {

  AFRAME.registerComponent('remote-avatar', {

    // Component schema (incoming properties)
    schema: {
      interpolationTime: {type: 'number', default: 500},
    },

    // Component variables
    interpolationBuffer: undefined as InterpolationBuffer | undefined,
    cameraPosition: new AFRAME.THREE.Vector3(),
    distance: 1000,

    // Component a-frame callbacks
    init: function () {
      console.log('Remote avatar init', this.data.id);
      this.initInterpolationBuffer();
      this.initCameraListener();
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
    },

    // Component functions
    initInterpolationBuffer: function () {
      this.interpolationBuffer = new InterpolationBuffer(undefined, this.data.interpolationTime / 1000);
      const interpolationBuffer = this.interpolationBuffer;

      this.el.addEventListener('moveTo', function (e) {
        // // Interpolate with buffered-interpolation
        // console.log('Move to',e);
        const pos = (e as DetailEvent<{position: [number, number, number]}>).detail.position;
        interpolationBuffer.setPosition(new AFRAME.THREE.Vector3(pos[0], pos[1], pos[2]));
      });

      this.el.addEventListener('rotateTo', function (e) {
        // // Interpolate with buffered-interpolation
        // console.log('Rotate to',e);
        const rot = (e as DetailEvent<{orientation: [number, number, number, number]}>).detail.orientation;
        interpolationBuffer.setQuaternion(new AFRAME.THREE.Quaternion(rot[0], rot[1], rot[2], rot[3]));
      });
    },
    initCameraListener: function () {
      const cameraPosition = this.cameraPosition;
      this.el.addEventListener('cameraPosition', function (e) {
        // console.log('Camera position', e.detail.position);

        const pos = (e as DetailEvent<{position: [number, number, number]}>).detail.position;
        cameraPosition.x = pos[0];
        cameraPosition.y = pos[1];
        cameraPosition.z = pos[2];
        // cameraPosition.copy(new AFRAME.THREE.Vector3(e.detail.position[0], e.detail.position[1], e.detail.position[2]));
      });
    },
    distanceToCamera: function () {
      const distanceOld = this.distance;
      // Note: calculating distance between LOCAL position vectors, not taking into account the world position.
      // This should be fine as long as the camera and the avatars share the same origin position.
      this.distance = this.el.object3D.position.distanceTo(this.cameraPosition);
      const threshold = 3;
      if(distanceOld > threshold && this.distance <= threshold){
        // console.log('I am close', this.el);
        this.el.emit('close', this.distance);
      }
      else if(distanceOld <= threshold && this.distance > threshold){
        // console.log('No longer close', this.el);
        this.el.emit('far', this.distance);
      }
    },
  });

};
