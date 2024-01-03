export default () => {

  AFRAME.registerComponent('model-opacity', {
    schema: {
      opacity: {type: 'number', default: 1.0},
    },
    init: function () {
      this.el.addEventListener('model-loaded', this.update.bind(this));
      this.update();
    },
    update: function () {
      console.log('model-opacity updated:', this.data);
      const mesh = this.el.getObject3D('mesh');
      const opacity = this.data.opacity;
      if (!mesh) { return; }
      mesh.traverse(function (node) {
        const mesh = node as THREE.Mesh;
        if (mesh.isMesh) {
          if(Array.isArray(mesh.material)) return;
          mesh.material.opacity = opacity;
          mesh.material.transparent = opacity < 1.0;
          mesh.material.needsUpdate = true;
        }
      });
    },
  });
};