import 'aframe';
import emitMove from './emit-move';
import rotationControl from './rotation-control';
import remoteAvatar from './remote-avatar';
import navmesh from './simple-navmesh-constraint';
import raycasterListen from './raycaster-listen';
import hoverHighlight from './hover-highlight';
import mediastreamAudioSource from './mediastream-audio-source';
import modelOpacity from './model-opacity';

const registerComponents = () => {
  console.log('Register a-frame components');
  emitMove();
  remoteAvatar();
  navmesh();
  raycasterListen();
  rotationControl();
  hoverHighlight();
  mediastreamAudioSource();
  modelOpacity();

  // @ts-ignore
  import('aframe-environment-component');
  
  // // @ts-ignore
  // import('aframe-orbit-controls');
  // We had to tweak the orbit controls to avoid grab cursor leaking outside canvas element. Pull request is submitted to superframe.
  import('./orbit-controls/orbit-controls');
};

export default {
  registerAframeComponents: registerComponents,
};

