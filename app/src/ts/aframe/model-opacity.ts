export default () => {

  AFRAME.registerComponent('model-opacity', {
    schema: {default: 1.0},
    init: function () {
      this.el.addEventListener('model-loaded', this.update.bind(this));
    },
    update: function () {
      const mesh = this.el.getObject3D('mesh');
      const data = this.data;
      if (!mesh) { return; }
      mesh.traverse(function (node) {
        const mesh = node as THREE.Mesh;
        if (mesh.isMesh) {
          if(Array.isArray(mesh.material)) return;
          mesh.material.opacity = data;
          mesh.material.transparent = data < 1.0;
          mesh.material.needsUpdate = true;
        }
      });
    },
  });
};