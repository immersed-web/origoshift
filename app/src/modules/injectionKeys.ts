
import type { InjectionKey, Ref } from 'vue';
import type { Scene } from 'aframe';
export const aFrameSceneProvideKey = Symbol() as InjectionKey<{ sceneTag: Ref<Scene | undefined>, domOutlet: Ref<HTMLDivElement | undefined>}>;