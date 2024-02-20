export default () => {
  AFRAME.registerComponent('lock-rotation-axis', {
    // schema: {
    //   axis: {type: 'string', default: 'x'},
    // },
    worldRotationQ: new THREE.Quaternion(),
    worldRotationE: new THREE.Euler(),
    worldRotationMatrix: new THREE.Matrix4(),
    init: function () {
      // console.log('INIT lock-rotation-axis component');
      this.worldRotationE.order = 'YXZ';
      // if(!AFRAME.utils.throttleTick) {
      //   console.error('AFRAME doesnt seem to be available (yet). Tried to use throttleTick util function.');
      //   return;
      // }
      this.tick = AFRAME.utils.throttleTick(this.tick, 20, this);
    },
    update: function () {
      
    },
    tick(_time, _timeDelta) {
      // if(!this.el.object3D) {
      //   console.error('this.el.object3d was unavailable!');
      //   return;
      // }
      this.el.object3D.getWorldQuaternion(this.worldRotationQ);
      this.worldRotationE.setFromQuaternion(this.worldRotationQ);
      // this.worldRotationE.x = 0;
      // this.worldRotationE.z = 0;
      this.worldRotationE.y = 0;
      this.worldRotationMatrix.makeRotationFromEuler(this.worldRotationE);
      
      this.el.object3D.applyMatrix4(this.worldRotationMatrix.invert());

    },
  });
};