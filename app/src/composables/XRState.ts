import type { Scene } from 'aframe';
import { ref, type Ref } from 'vue';
// import { onBeforeRouteLeave } from 'vue-router';
import { useEventListener, tryOnMounted, whenever } from '@vueuse/core';


let eventListenersAttached = false
const isImmersed = ref(false);
// const navigatedWhileImmersed = ref(false);
// const timeoutControl = ref<ReturnType<typeof useTimeoutFn>>();
let timeoutId: number | undefined = undefined;
export function useXRState(sceneEl: Ref<Scene | undefined>){
  if(sceneEl.value){
    isImmersed.value = sceneEl.value.is('vr-mode');
  }
  // TODO: Find a way to track when listeners get deattached so we can flip the attached flag back to false.
  if(!eventListenersAttached){
    useEventListener(sceneEl, 'enter-vr', () => {
      console.log('entered VR event');
      isImmersed.value = true;
    });
    useEventListener(sceneEl, 'exit-vr', () => {
      console.log('exited VR event');
      isImmersed.value = false;
    });
    eventListenersAttached = false;
  }
  

  // tryOnMounted(() => {
  //   // timeoutControl.value?.stop();
  //   // console.log(timeoutId);
  //   clearTimeout(timeoutId);
  //   // console.log('navigatedWhileImmersed:', navigatedWhileImmersed.value);
  //   if(navigatedWhileImmersed.value){
  //     whenever(sceneEl, (el)=> {
  //       console.log('gonna try to restore immersive VR session');
  //       el.enterVR();
  //       // el.addEventListener('loaded', () => {
  //       //   sceneEl.value!.enterVR();
  //       // });
  //     }, {immediate: true});
  //   }
  // });
  // onBeforeRouteLeave((to, from)=>{
  //   navigatedWhileImmersed.value = isImmersed.value;
  //   // console.log('navigatedWhileImmersed:', navigatedWhileImmersed.value);

  //   if(sceneEl.value){
  //     console.log('Exiting VR!!');
  //     // sceneEl.value.exitVR();
  //     if(timeoutId) clearTimeout(timeoutId);
      
  //     // Below (in combination with the clearTimeout above) is a sligtly hacky way to
  //     // stop immersive mode as soon as we land on a page that isnt using this composable
  //     // @ts-ignore
  //     timeoutId = setTimeout(() => {
  //       console.log('removing immersive flag');
  //       navigatedWhileImmersed.value = false;
  //     }, 500);
  //   } else {
  //     console.warn('sceneEl ref was undefined');
  //     console.warn(sceneEl.value);
  //   }
  // });
  
  return {
    isImmersed,
  };
}