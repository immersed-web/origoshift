import 'aframe';
import InterpolationBuffer from 'buffered-interpolation';

export default () => {

  AFRAME.registerComponent('remote-avatar', {
    schema: {
      id: String,
    },
    interpolationBuffer: undefined as InterpolationBuffer | undefined,
    init: function () {
      console.log('Remote avatar init', this.data.id);
      this.interpolationBuffer = new InterpolationBuffer(undefined, 1);
      const interpolationBuffer = this.interpolationBuffer;
      this.el.addEventListener('moveTo-'+this.data.id, function (e) {
        // console.log('Moving remote avatar', data.id, e.detail.position);

        // // Interpolate with buffered-interpolation
        interpolationBuffer.setPosition(new AFRAME.THREE.Vector3(e.detail.position[0], e.detail.position[1], e.detail.position[2]));

        // // Quick jump
        // el.object3D.position.x = e.detail.position[0];
        // el.object3D.position.y = e.detail.position[1];
        // el.object3D.position.z = e.detail.position[2];


      });
    },
    tick: function (time, timeDelta) {

      if(this.interpolationBuffer){
        // Interpolate with buffered-interpolation - no workie yet.
        this.el.object3D.position.copy(this.interpolationBuffer.getPosition());

        // update buffer position
        this.interpolationBuffer.update(timeDelta);
      }

    },
  });

};
