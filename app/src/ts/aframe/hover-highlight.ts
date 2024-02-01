export default () => {

  AFRAME.registerComponent<{startScale: THREE.Vector3, isResized: boolean}>('hover-highlight', {
    startScale: new THREE.Vector3(1,1,1),
    isResized: false,
    schema: {
      scaleFactor: {type: 'number', default: 1.1},
    },
    init: function () {
      const el = this.el;
      this.startScale = el.object3D.scale.clone();
      el.addEventListener('mouseenter', () => {
        if(!this.isResized){
          this.startScale = el.object3D.scale.clone();
        }
        this.isResized = true;
        el.removeAttribute('animation__nohover');
        const toScale = this.startScale.clone().multiplyScalar(this.data.scaleFactor);
        const animationString = `property: scale; to: ${toScale.x} ${toScale.y} ${toScale.z}; dur: 100;`;
        el.setAttribute('animation__hover', animationString);
      });
      el.addEventListener('mouseleave', () => {
        el.removeAttribute('animation__hover');
        const animationString = `property: scale; to: ${this.startScale.x} ${this.startScale.y} ${this.startScale.z}; dur: 200;`;
        el.setAttribute('animation__nohover', animationString);
        (<HTMLElement>el).addEventListener('animationcomplete__nohover', () => {
          this.isResized = false;
        }, {once: true});
        
      });
    },
  });
};
