import 'aframe';
import InterpolationBuffer from 'buffered-interpolation';

export default () => {

  AFRAME.registerComponent('remote-avatar', {
    schema: {
    },
    interpolationBuffer: new InterpolationBuffer(undefined, 1),
    init: function () {
      const interpolationBuffer = this.interpolationBuffer;
      this.el.addEventListener('moveTo', function (e) {
      // console.log('Remote avatar, move to', e.detail.position);

        // // Interpolate with buffered-interpolation
        interpolationBuffer.setPosition(new AFRAME.THREE.Vector3(e.detail.position[0], e.detail.position[1], e.detail.position[2]));

      });
    },
    tick: function (time, timeDelta) {
    // // Interpolate with buffered-interpolation - no workie yet.
      this.el.object3D.position.copy(this.interpolationBuffer.getPosition());

      // delta value should be calculated
      this.interpolationBuffer.update(timeDelta);
    },
  });

};
