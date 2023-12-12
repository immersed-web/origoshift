// import 'aframe';
import type { DetailEvent, Entity } from 'aframe';

export default () => {

  AFRAME.registerComponent<{raycaster: Entity | null, prev: THREE.Vector3}>('raycaster-listen', {
    raycaster: null,
    prev: new THREE.Vector3,
    init: function () {
    // Use events to figure out what raycaster is listening so we don't have to
    // hardcode the raycaster.
      this.el.addEventListener('raycaster-intersected', (evt) => {
        this.raycaster = (evt as DetailEvent<{el: Entity}>).detail.el;
      });
      this.el.addEventListener('raycaster-intersected-cleared', evt => {
        this.raycaster = null;
      });
    },

    tick: function () {
      if (!this.raycaster) { return; }  // Not intersecting.

      // @ts-ignore
      const intersection = this.raycaster.components.raycaster.getIntersection(this.el);
      if (!intersection) { return; }
      if(AFRAME.utils.coordinates.stringify(intersection.point) !== AFRAME.utils.coordinates.stringify(this.prev)){
        // console.log(intersection.point);
        this.el.emit('raycast-change', intersection);
      }
      this.prev = intersection.point;
    },
  });
};
