import type { Entity } from "aframe";

export default () => {
  AFRAME.registerComponent('lock-rotation-axis', {
    schema: {
      // axis: {type: 'string', default: 'x'},
      targetEntity: {
        type: 'selector'
      }
    },
    targetElement: undefined as undefined | Entity,
    worldRotationQ: undefined as undefined | THREE.Quaternion,
    worldRotationE: undefined as undefined | THREE.Euler,
    worldRotationMatrix: undefined as undefined | THREE.Matrix4,
    init: function () {
      console.log('INIT lock-rotation-axis component');
      this.worldRotationQ = new THREE.Quaternion(),
      this.worldRotationE = new THREE.Euler(),
      this.worldRotationMatrix = new THREE.Matrix4(),
      this.worldRotationE.order = 'YXZ';
      // if(!AFRAME.utils.throttleTick) {
      //   console.error('AFRAME doesnt seem to be available (yet). Tried to use throttleTick util function.');
      //   return;
      // }
      // this.tick = AFRAME.utils.throttleTick(this.tick, 20, this);
    },
    update: function () {
      this.targetElement = this.data.targetEntity as Entity;
      if(!this.targetElement){
        this.targetElement = this.el.parentElement as Entity;
      }
      console.log(this.targetElement);
    },
    tick(_time, _timeDelta) {
      // if(!this.el.object3D) {
      //   console.error('this.el.object3d was unavailable!');
      //   return;
      // }
      if(!this.targetElement) {
        console.error('no target element set to read reference orientation from');
        return;
      }
      this.targetElement.object3D.getWorldQuaternion(this.worldRotationQ!);
      // console.log(targetWorldRotation.toArray());
      // const targetEuler = targetEntity.object3D.rotation;
      // this.el.object3D.rotation.set(-targetEuler.x, 0, 0);
      // this.el.object3D.setRotationFromQuaternion(targetWorldRotation.invert());


      // const currentRot = this.el.object3D.rotation;
      // this.el.object3D.rotation.set(0, currentRot.y, 0);

      // this.el.object3D.getWorldQuaternion(this.worldRotationQ!);
      this.worldRotationE!.setFromQuaternion(this.worldRotationQ!);
      // this.worldRotationE!.x = 0;
      // this.worldRotationE!.z = 0;
      this.worldRotationE!.y = 0;
      this.worldRotationMatrix!.makeRotationFromEuler(this.worldRotationE!);
      
      
      // this.el.object3D.applyMatrix4(this.worldRotationMatrix!.invert());
      this.el.object3D.rotation.setFromRotationMatrix(this.worldRotationMatrix!.invert());
    },
  });
};