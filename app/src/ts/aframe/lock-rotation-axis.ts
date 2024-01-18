export default () => {
  AFRAME.registerComponent('lock-rotation-axis', {
    // schema: {
    //   axis: {type: 'string', default: 'x'},
    // },
    worldRotationQ: new THREE.Quaternion(),
    worldRotationE: new THREE.Euler(),
    worldRotationMatrix: new THREE.Matrix4(),
    init: function () {
      this.worldRotationE.order = 'YXZ';
      this.tick = AFRAME.utils.throttleTick(this.tick, 20, this);
    },
    update: function () {
      
    },
    tick(_time, _timeDelta) {
      this.el.object3D.getWorldQuaternion(this.worldRotationQ);
      this.worldRotationE.setFromQuaternion(this.worldRotationQ);
      // this.worldRotationE.x = 0;
      this.worldRotationE.z = 0;
      this.worldRotationE.y = 0;
      this.worldRotationMatrix.makeRotationFromEuler(this.worldRotationE);
      
      this.el.object3D.applyMatrix4(this.worldRotationMatrix.invert());

    },
  });
};