import 'aframe';

type MoveUpdate = {orientation: [number, number, number, number], position: [number, number, number]}
export default () => {

  AFRAME.registerComponent('emit-move', {
    schema: {
      interval: {type: '', default: 100},
    },
    position: '',
    orientation: '',
    interval: 0,
    throttledEmitMovement: undefined as unknown as (moveUpdate: MoveUpdate) => void,
    emitMovement: function (newTransform: MoveUpdate) {
      this.el.emit('move', newTransform);
    },
    update: function(){
      this.interval = this.data.interval;
      // @ts-ignore
      this.throttledEmitMovement = AFRAME.utils.throttleLeadingAndTrailing(this.emitMovement, this.interval, this);
    },
    tick: function () {
      const worldPos = this.el.object3D.getWorldPosition(new AFRAME.THREE.Vector3());
      const newPosition = AFRAME.utils.coordinates.stringify(worldPos);
      const moved = newPosition !== this.position;

      const worldRot = this.el.object3D.getWorldQuaternion(new AFRAME.THREE.Quaternion());
      const newOrientation = AFRAME.utils.coordinates.stringify(worldRot);
      const rotated = newOrientation !== this.orientation;

      if(moved || rotated) {
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
