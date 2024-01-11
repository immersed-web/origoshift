import 'aframe';
import emitMove from './emit-move';
import rotationControl from './rotation-control';
import remoteAvatar from './remote-avatar';
import navmesh from './simple-navmesh-constraint';
import raycasterListen from './raycaster-listen';
import hoverHighlight from './hover-highlight';
import mediastreamAudioSource from './mediastream-audio-source';
import modelOpacity from './model-opacity';
import grid from './grid';
import followPosition from './follow-position';

let componentsAreRegistered = false;

const registerComponents = () => {
  if(componentsAreRegistered) {
    console.info('aframe components are already registered. skipping');
    return;
  }
  console.log('Registering a-frame components');
  emitMove();
  remoteAvatar();
  navmesh();
  raycasterListen();
  rotationControl();
  hoverHighlight();
  mediastreamAudioSource();
  modelOpacity();
  grid();
  followPosition();

  // @ts-ignore
  // import('aframe-environment-component');
  
  // @ts-ignore
  // import('aframe-extras');
  
  // TODO: Find out why rig and camera seems to be a few decimeter of in horizontal position. Only in real VR though. Not in browser as it seems at least.
  // @ts-ignore
  import('aframe-blink-controls');

  // // @ts-ignore
  // import('aframe-orbit-controls');
  // We had to tweak the orbit controls to avoid grab cursor leaking outside canvas element. Pull request is submitted to superframe.
  import('./orbit-controls/orbit-controls');
  componentsAreRegistered = true;
};

export default {
  registerAframeComponents: registerComponents,
};

