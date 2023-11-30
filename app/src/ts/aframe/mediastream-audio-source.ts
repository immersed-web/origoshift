import type { DetailEvent, Scene } from 'aframe';

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
    stream: null as MediaStream | null,
    // audioSourceNode: null as MediaElementAudioSourceNode | null,
    // audioEl: null as HTMLAudioElement | null,
    events: {
      mediaStream: function(e: DetailEvent<{stream: MediaStream}>){
        if(this.stream === e.detail.stream){
          console.warn('That stream was already assigned to the entity! Skipping');
          return;
        }
        console.log('Attaching new stream to entity');
        this.stream = e.detail.stream;
        this.positionalAudio?.setMediaStreamSource(this.stream);
        this.positionalAudio?.play();
      },
    },

    init: function () {
      this._setupSound = this._setupSound.bind(this);
      this._setupSound();
      console.log('mediastream-audio-source initialized');
    },

    update(oldData) {
    // if (!this.positionalAudio) {
    //   return;
    // }
      // if(this.data.audioElement === oldData.audioElement) return;
      // console.log('data.audioElement:', this.data.audioElement);
      // if(!this.data.audioElement) {
      //   const firstChildAudioElement = this.el.querySelector('audio');
      //   if(!firstChildAudioElement) {
      //     throw Error('no audio element found. Need to set source for audioNode');
      //   }
      //   this.audioEl = firstChildAudioElement;
      // } else {
      //   this.audioEl = this.data.audioElement;
      // }
      this._setPannerProperties();
    },

    _setPannerProperties() {
      this.positionalAudio!.setDistanceModel(this.data.distanceModel);
      this.positionalAudio!.setMaxDistance(this.data.maxDistance);
      this.positionalAudio!.setRefDistance(this.data.refDistance);
      this.positionalAudio!.setRolloffFactor(this.data.rolloffFactor);
    },

    remove() {
      this.destroySound();
    },

    destroySound() {
      if (this.positionalAudio) {
      // this.el.emit('sound-source-removed', { soundSource: this.soundSource });
        this.positionalAudio.disconnect();
        this.el.removeObject3D(this.attrName!);
        this.positionalAudio = null;
      }

      //   // if (this.audioEl) {
      //   //   this.audioEl.pause();
      //   //   this.audioEl.srcObject = null;
      //   //   this.audioEl.load();
      //   //   this.audioEl = null;
      //   // }
    },

    _setupSound() {
      const el = this.el;
      const sceneEl: Scene & {audioListener?: THREE.AudioListener} = el.sceneEl!;

      //this makes sure we ever only have one audioListener
      if (!sceneEl.audioListener) {
        sceneEl['audioListener'] = new THREE.AudioListener();
        sceneEl.camera && sceneEl.camera.add(sceneEl.audioListener);
        sceneEl.addEventListener('camera-set-active', function(evt: any) {
          evt.detail.cameraEl.getObject3D('camera').add(sceneEl.audioListener);
        });
      }

      this.positionalAudio = new THREE.PositionalAudio(sceneEl.audioListener);
      el.setObject3D(this.attrName!, this.positionalAudio);

      // if(!this.audioEl?.srcObject) return;
      // console.log('assigning audioElement to positional audio!!!', this.audioEl, this.positionalAudio);
      // // @ts-ignore
      // this.positionalAudio.setMediaStreamSource(this.audioEl.srcObject);
      // // this.positionalAudio.setMediaElementSource(this.audioEl!);
      // this.positionalAudio.play();
    // this.el.emit('sound-source-set', { soundSource: this.audioSourceNode });
    // this.stream = newStream;
    },
  });
};