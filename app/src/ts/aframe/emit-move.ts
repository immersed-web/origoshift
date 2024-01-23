
type MoveUpdate = {orientation: [number, number, number, number], position: [number, number, number]}
// TODO: avoid creating new vector and quaternion in tick. Reuse instead!
export default () => {

  AFRAME.registerComponent('emit-move', {
    schema: {
      interval: {type: 'number', default: 100},
      relativeToCamera: {type: 'boolean', default: false},
    },
    position: '',
    orientation: '',
    interval: 0,
    // angle: 0,
    throttledEmitMovement: undefined as unknown as (moveUpdate: MoveUpdate) => void,
    emitMovement: function (newTransform: MoveUpdate) {
      this.el.emit('move', newTransform);
      // if(this.data.relativeToCamera){
      //   console.log('angle',THREE.MathUtils.radToDeg(this.angle));
      // }
    },
    update: function(){
      this.interval = this.data.interval;
      const worldPos = this.el.object3D.getWorldPosition(new AFRAME.THREE.Vector3());
      this.position = AFRAME.utils.coordinates.stringify(worldPos);
      const worldRot = this.el.object3D.getWorldQuaternion(new AFRAME.THREE.Quaternion());
      this.orientation = AFRAME.utils.coordinates.stringify(worldRot);
      // @ts-ignore
      this.throttledEmitMovement = AFRAME.utils.throttleLeadingAndTrailing(this.emitMovement, this.interval, this);
    },
    tick: function () {
      const worldPos = this.el.object3D.getWorldPosition(new AFRAME.THREE.Vector3());
      const worldRot = this.el.object3D.getWorldQuaternion(new AFRAME.THREE.Quaternion());

      if(this.data.relativeToCamera){
        const cameraWorldMatrixInverse = this.el.sceneEl?.camera.matrixWorldInverse!;
        const relativeMatrix = new THREE.Matrix4();
        relativeMatrix.multiply(cameraWorldMatrixInverse).multiply(this.el.object3D.matrixWorld);
        worldPos.setFromMatrixPosition(relativeMatrix);
        worldRot.setFromRotationMatrix(relativeMatrix);
        // this.angle = worldRot.angleTo(new THREE.Quaternion());
      }

      const newPosition = AFRAME.utils.coordinates.stringify(worldPos);
      const newOrientation = AFRAME.utils.coordinates.stringify(worldRot);

      const moved = newPosition !== this.position;
      const rotated = newOrientation !== this.orientation;

      if(moved || rotated) {
        // console.log('emit-move component: transform updated', newPosition, newOrientation);
        const position = worldPos.toArray();
        const orientation = worldRot.toArray() as [number, number, number, number];
        const transform = {position, orientation};
        this.throttledEmitMovement(transform);
      } 
      this.position = newPosition;
      this.orientation = newOrientation;
    },
  });

};
