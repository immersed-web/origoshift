import 'aframe';
import emitMove from './emit-move';
import remoteAvatar from './remote-avatar';
import navmesh from './simple-navmesh-constraint';

const registerComponents = () => {
  console.log('Register a-frame components');
  emitMove();
  remoteAvatar();
  navmesh();
};

export default {
  registerAframeComponents: registerComponents,
};

