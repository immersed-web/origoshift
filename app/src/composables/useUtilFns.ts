// import { usePersistedStore } from 'src/stores/persistedStore';
// import { useUserStore } from 'src/stores/userStore';

// export default function useUtilFns () {
//   const persistedStore = usePersistedStore();
//   const userStore = useUserStore();

//   return {
//     async retoreOrInitializeGatheringName () {
//       if (!userStore.userData || !userStore.jwt) {
//         throw new Error('no userstate! needed to run camerapage');
//       }
//       let { gathering } = userStore.userData;
//       if (!gathering) {
//         if (!persistedStore.gatheringName) {
//           persistedStore.gatheringName = await pickGathering();
//         }
//         gathering = persistedStore.gatheringName;
//       }

//       if (!persistedStore.roomName) {
//         persistedStore.roomName = await pickRoom(gathering);
//       }
//     },
//   };
// }
