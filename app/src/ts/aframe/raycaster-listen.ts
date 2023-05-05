import 'aframe';
import { THREE, type DetailEvent, type EntityEventMap } from 'aframe';

export default () => {

  AFRAME.registerComponent('raycaster-listen', {
    raycaster: null,
    prev: THREE.Vector3,
    init: function () {
    // Use events to figure out what raycaster is listening so we don't have to
    // hardcode the raycaster.
      this.el.addEventListener('raycaster-intersected', (evt) => {
        this.raycaster = evt.detail.el;
      });
      this.el.addEventListener('raycaster-intersected-cleared', evt => {
        this.raycaster = null;
      });
    },

    tick: function () {
      if (!this.raycaster) { return; }  // Not intersecting.

      const intersection = this.raycaster.components.raycaster.getIntersection(this.el);
      if (!intersection) { return; }
      if(AFRAME.utils.coordinates.stringify(intersection.point) !== AFRAME.utils.coordinates.stringify(this.prev)){
        // console.log(intersection.point);
        this.el.emit('raycast-change', intersection.point);
      }
      this.prev = intersection.point;
    },
  });
};
