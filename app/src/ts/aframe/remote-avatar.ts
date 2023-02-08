import 'aframe';
import InterpolationBuffer from 'buffered-interpolation';

export default () => {

  AFRAME.registerComponent('remote-avatar', {

    // Component schema (incoming properties)
    schema: {},

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

        // update buffer position
        this.interpolationBuffer.update(timeDelta);
      }
      this.distanceToCamera();
    },

    // Component functions
    initInterpolationBuffer: function () {
      this.interpolationBuffer = new InterpolationBuffer(undefined, 1);
      const interpolationBuffer = this.interpolationBuffer;
      this.el.addEventListener('moveTo', function (e) {
        // console.log('Moving remote avatar', data.id, e.detail.position);

        // // Interpolate with buffered-interpolation
        interpolationBuffer.setPosition(new AFRAME.THREE.Vector3(e.detail.position[0], e.detail.position[1], e.detail.position[2]));

        // // Quick jump
        // el.object3D.position.x = e.detail.position[0];
        // el.object3D.position.y = e.detail.position[1];
        // el.object3D.position.z = e.detail.position[2];

      });
    },
    initCameraListener: function () {
      const cameraPosition = this.cameraPosition;
      this.el.addEventListener('cameraPosition', function (e) {
        // console.log('Camera position', e.detail.position);

        cameraPosition.x = e.detail.position[0];
        cameraPosition.y = e.detail.position[1];
        cameraPosition.z = e.detail.position[2];
        // cameraPosition.copy(new AFRAME.THREE.Vector3(e.detail.position[0], e.detail.position[1], e.detail.position[2]));
      });
    },
    distanceToCamera: function () {
      const distanceOld = this.distance;
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
