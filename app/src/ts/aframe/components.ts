import 'aframe';
import emitMove from './emit-move';
import rotationControl from './rotation-control';
import remoteAvatar from './remote-avatar';
import navmesh from './simple-navmesh-constraint';
import raycasterListen from './raycaster-listen';
import hoverHighlight from './hover-highlight';

const registerComponents = () => {
  console.log('Register a-frame components');
  emitMove();
  remoteAvatar();
  navmesh();
  raycasterListen();
  rotationControl();
  hoverHighlight();

  import('aframe-environment-component');
};

export default {
  registerAframeComponents: registerComponents,
};

