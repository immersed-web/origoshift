import 'aframe';

export default () => {

  AFRAME.registerComponent('emit-move', {
    schema: {
      intervals: {type: 'string', default: '100 1000'},
    },
    position: '',
    intervals: [] as number[],
    lastEmit: [Date.now()] as number[],
    firstEmitSent: [false] as boolean[],
    finalEmitSent: [false] as boolean[],
    emitPosition: function (i: number, position: string) {
      this.lastEmit[i] = Date.now();
      this.el.emit('move'+i, [this.el.object3D.position.x, this.el.object3D.position.y, this.el.object3D.position.z]);
    },
    init: function () {
      this.intervals = (this.data.intervals as string).split(' ').map(i => parseInt(i));
      console.log('Intervals', this.intervals);
    },
    tick: function () {
      const newPosition = AFRAME.utils.coordinates.stringify(this.el.object3D.position);
      const moved = newPosition !== this.position;
      this.intervals.forEach((interval,i) => {
        this.emitTest(i, newPosition, moved);
      });
      if(moved){
        this.position = newPosition;
      }
    },
    emitTest: function (i: number, position: string, moved: boolean){
      // If entity has moved since last tick
      if (moved) {
        // this.position = newPosition;
        if(!this.firstEmitSent[i] || Date.now() - this.lastEmit[i] > this.intervals[i]){
          this.emitPosition(i, position);
        }
        this.firstEmitSent[i] = true,
        this.finalEmitSent[i] = false;
      }
      // First tick after entity stopped moving
      else if(!this.finalEmitSent[i]){
        this.emitPosition(i, position);
        this.firstEmitSent[i] = false;
        this.finalEmitSent[i] = true;
      }
    },
  });

};
