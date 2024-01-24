import type { DetailEvent, Entity } from 'aframe';

export default () => {

  AFRAME.registerComponent('raycaster-listen', {
    raycaster: null as null | Entity,
    prev: new AFRAME.THREE.Vector3,
    stashedCursorStyle: undefined as string | undefined,
    init: function () {
    // Use events to figure out what raycaster is listening so we don't have to
    // hardcode the raycaster.
      // this.el.addEventListener('raycaster-intersected', (evt) => {
      //   this.raycaster = (evt as DetailEvent<{el: Entity}>).detail.el;
      //   const canvas = this.el.sceneEl!.canvas;
      //   this.stashedCursorStyle = canvas.style.cursor;
      //   canvas.style.cursor = 'pointer';
      // });
      // this.el.addEventListener('raycaster-intersected-cleared', evt => {
      //   this.raycaster = null;
      //   const canvas = this.el.sceneEl!.canvas;
      //   if(this.stashedCursorStyle) { 
      //     canvas.style.cursor = this.stashedCursorStyle;
      //   }
      // });
      this.tick = AFRAME.utils.throttleTick(this.tick!, 10, this);
    },
    events: {
      'raycaster-intersected': function(evt: DetailEvent<{el: Entity}>) {
        this.raycaster = evt.detail.el;
        const canvas = this.el.sceneEl!.canvas;
        const canvasCursor = canvas.style.cursor;
        if(canvasCursor !== '') {
          console.log('stashing canvasCursor:', canvasCursor);
          this.stashedCursorStyle = canvasCursor;
          canvas.style.cursor = 'pointer';
        }
      },
      'raycaster-intersected-cleared': function(evt: DetailEvent<any>){
        this.raycaster = null;
        const canvas = this.el.sceneEl!.canvas;
        if(this.stashedCursorStyle) { 
          canvas.style.cursor = this.stashedCursorStyle;
        }
        this.el.emit('raycast-out', evt);
      },
    },
    tick: function (t, dt) {
      if (!this.raycaster) { return; }  // Not intersecting.

      // @ts-ignore
      const intersection = this.raycaster.components.raycaster.getIntersection(this.el);
      if (!intersection.point) { return; }
      if(AFRAME.utils.coordinates.stringify(intersection.point) !== AFRAME.utils.coordinates.stringify(this.prev)){
        // console.log(intersection.point);
        this.el.emit('raycast-change', {intersection});
      }
      this.prev = intersection.point;
    },
  });
};
