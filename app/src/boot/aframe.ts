import { boot } from 'quasar/wrappers';
import AFRAME, { Entity, THREE, DetailEvent } from 'aframe';

// Vue.
// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({ app }) => {
  // I did the a-tag exception in quasar config instead cause that worked...
  // app.config.compilerOptions.isCustomElement = tag => {
  //   return tag.startsWith('a-');
  // };

  AFRAME.registerComponent<{
    target?: Entity,
    trigger?: Entity,
    rotating?: boolean,
    targetStartRotation?: InstanceType<typeof THREE.Quaternion>,
    controllerStartY?: number,
    controllerStartX?: number,
    controllerY?: number,
    controllerX?: number,
  }>('rotation-control', {
    schema: {
      rotationTrigger: { default: '.rotation-trigger' },
      rotationTarget: { default: '.rotation-target' },
    },
    init: function () {
      this.tick = AFRAME.utils.throttleTick(this.tick!, 5, this);
      // console.log('AFRAME COMPONENT INITIALIZED!!!!!!!');
      this.el.object3D.rotation.reorder('YXZ');
      this.controllerX = 0;
      this.controllerY = 0;
      this.target = document.querySelector(this.data.rotationTarget as string);
      if (!this.target) {
        console.warn('no target for rotation control');
        return;
      }
      this.target.object3D.rotation.reorder('YXZ');
      // console.log('target is:', this.target);
      this.trigger = document.querySelector(this.data.rotationTrigger as string);
      if (!this.trigger) {
        console.warn('no trigger for rotation-control');
        return;
      }
      // console.log('trigger is:', this.trigger);
      this.trigger.addEventListener('mousedown', (ev) => {
        const evt = ev as DetailEvent<{cursorEl: Entity}>;
        if (evt.detail.cursorEl !== this.el) return;
        const controllerObject3d = this.el.object3D;
        this.targetStartRotation = this.target?.object3D.getWorldQuaternion(new THREE.Quaternion());

        this.controllerStartY = controllerObject3d.rotation.y;
        this.controllerStartX = controllerObject3d.rotation.x;

        this.rotating = true;
      });
      this.trigger.addEventListener('mouseup', (ev) => {
        const evt = ev as DetailEvent<{cursorEl: Entity}>;
        if (evt.detail.cursorEl !== this.el) return;
        this.rotating = false;
      });
    },
    tick: function (_time, _dt) {
      if (!this.rotating) return;
      try {
        if (!this.targetStartRotation) throw Error('no target start roation set');
        if (this.controllerStartX === undefined || this.controllerStartY === undefined || this.controllerX === undefined || this.controllerY === undefined) throw Error('controller angles (start or current) undefined');
        if (!this.target) throw Error('target is undefined');
        const controller = this.el;
        this.controllerX = controller.object3D.rotation.x;
        this.controllerY = controller.object3D.rotation.y;
        // console.log(this.controllerStartX, this.controllerStartY);
        // console.log(this.controllerX, this.controllerY);
        // console.log(this.controllerX - this.controllerStartX, this.controllerY - this.controllerStartY);

        const deltaX = this.controllerX - this.controllerStartX;
        const deltaY = this.controllerY - this.controllerStartY;
        this.target.object3D.setRotationFromQuaternion(this.targetStartRotation);
        this.target.object3D.rotation.y += deltaY;
        this.target.object3D.rotation.x += deltaX;
        this.target.object3D.rotation.z = 0;
      } catch (e) {
        console.error(e);
      }
    },
  });
});

// import something here

// // "async" is optional;
// // more info on params: https://quasar.dev/quasar-cli/cli-documentation/boot-files#Anatomy-of-a-boot-file
// export default ({ Vue }) => {
//   // ignore a frame elements!!
//   Vue.config.ignoredElements = [/a-*/];
// };
