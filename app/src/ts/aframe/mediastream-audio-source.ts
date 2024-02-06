import type { DetailEvent, Entity, Scene } from 'aframe';

export default () => {
  AFRAME.registerComponent('mediastream-audio-source', {
    schema: {
      distanceModel: {
        default: 'inverse',
        oneOf: ['linear', 'inverse', 'exponential'],
      },
      maxDistance: { default: 10 },
      refDistance: { default: 1 },
      rolloffFactor: { default: 1 },
      audioElement: {type: 'selector', default: '#completelyRandomAsIHopeyouneverhaveanidthisspecific'},
    },
    positionalAudio: null as THREE.PositionalAudio | null,
    analyzer: null as THREE.AudioAnalyser | null,
    audioLevel: 1,
    levelEntity: undefined as Entity | undefined,
    stream: null as MediaStream | null,
    events: {
      'setMediaStream': function(e: DetailEvent<{stream: MediaStream}>){
        console.log('mediastream component received stream event!!');
        if(this.stream === e.detail.stream){
          console.warn('That stream was already assigned to the entity! Skipping');
          return;
        }
        console.log('Attaching new stream to entity');
        this.stream = e.detail.stream;
        this.positionalAudio?.setMediaStreamSource(this.stream);
        this.positionalAudio?.play();
        if(!this.levelEntity){
          console.error('no level entity!!');
          return;
        }
        this.levelEntity?.setAttribute('visible', true);
      },
    },

    init: function () {
      const el = this.el;
      const sceneEl: Scene & {audioListener?: THREE.AudioListener} = el.sceneEl!;
      
      this.tick = AFRAME.utils.throttleTick(this.tick, 20, this);

      //this makes sure we ever only have one audioListener
      if (!sceneEl.audioListener) {
        sceneEl['audioListener'] = new THREE.AudioListener();
        sceneEl.camera && sceneEl.camera.add(sceneEl.audioListener);
        sceneEl.addEventListener('camera-set-active', function(evt: any) {
          evt.detail.cameraEl.getObject3D('camera').add(sceneEl.audioListener);
        });
      }

      this.positionalAudio = new THREE.PositionalAudio(sceneEl.audioListener);
      this.analyzer = new THREE.AudioAnalyser(this.positionalAudio, 32);

      el.setObject3D(this.attrName!, this.positionalAudio);

      this.levelEntity = this.el.querySelector('.audio-level') as Entity;
      if(this.levelEntity){
        this.levelEntity.setAttribute('visible', false);
      }
      this.setPannerProperties();
      console.log('mediastream-audio-source initialized');
    },
    tick(time, timeDelta) {
      if(!this.analyzer){
        console.error('no analyzer!');
        return;
      }
      const data = this.analyzer.getFrequencyData();
      let sum = 0;
      data.forEach(n => sum+= n);
      this.audioLevel = sum * 0.0005;
      // const scale = Math.min(1 + this.audioLevel, 1.5);
      // this.levelEntity?.object3D.scale.set(scale, scale, 1);
      // console.log(this.audioLevel);
      if(this.audioLevel > 0.25){
        const scaleChange = Math.random() * 0.5 - 0.25;
        this.levelEntity?.object3D.scale.set(1 + 0.2 * scaleChange , 1 + scaleChange, 1);
      } else {
        this.levelEntity?.object3D.scale.set(1, 1, 1);
      }
    },
    update() {
      this.setPannerProperties();
    },

    setPannerProperties() {
      if(!this.positionalAudio) return;
      this.positionalAudio.setDistanceModel(this.data.distanceModel);
      this.positionalAudio.setMaxDistance(this.data.maxDistance);
      this.positionalAudio.setRefDistance(this.data.refDistance);
      this.positionalAudio.setRolloffFactor(this.data.rolloffFactor);
    },

    remove() {
      this.destroySound();
    },

    destroySound() {
      if (this.positionalAudio) {
        this.positionalAudio.disconnect();
        this.el.removeObject3D(this.attrName!);
        this.positionalAudio = null;

        this.analyzer?.analyser.disconnect();
        this.analyzer = null;
      }
    },
  });
};