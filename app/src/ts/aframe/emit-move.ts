import 'aframe';

export default () => {

  AFRAME.registerComponent('emit-move', {
    schema: {
      interval: {type: 'int', default: 100},
    },
    position: '',
    lastEmit: Date.now(),
    firstEmitSent: false,
    finalEmitSent: false,
    emitPosition: function (position: string) {
      this.lastEmit = Date.now();
      this.el.emit('move', position);
    },
    tick: function () {
      const newPosition = AFRAME.utils.coordinates.stringify(this.el.object3D.position);
      // If entity has moved since last tick
      if (newPosition !== this.position) {
        this.position = newPosition;
        if(!this.firstEmitSent || Date.now() - this.lastEmit > this.data.interval){
          this.emitPosition(newPosition);
        }
        this.firstEmitSent = true,
        this.finalEmitSent = false;
      }
      // First tick after entity stopped moving
      else if(!this.finalEmitSent){
        this.emitPosition(newPosition);
        this.firstEmitSent = false;
        this.finalEmitSent = true;
      }
    },
  });

};
