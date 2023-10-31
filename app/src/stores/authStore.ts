import { defineStore } from 'pinia';
import { logout as authLogout, login as authLogin, userAutoToken, guestAutoToken } from '@/modules/authClient';
import { hasAtLeastSecurityLevel, type JwtPayload } from 'schemas/esm';
import jwtDecode from 'jwt-decode';
import { computed, ref } from 'vue';

const browserHasCookie = () => {
  const cookieValue = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${import.meta.env.EXPOSED_PROJECT_NAME}=`))
    ?.split('=')[1];
  return !!cookieValue;
};


export const useAuthStore = defineStore('auth', () => {
  const _reset = () => {
    token.value = undefined;
    hasCookie.value = browserHasCookie();
  };

  const token = ref<string>();
  const tokenOrThrow = () => {
    console.log('accessing tokenOrThrow');
    if(!token.value) {
      throw Error('token was undefined when trying to access it from authstore');
    }
    return token.value;
  };
  const hasCookie = ref<boolean>(browserHasCookie());

  const userData = computed(() => {
    try {
      if (!token.value) {
        throw new Error('token is undefined');
      }
      const decodedToken = jwtDecode<JwtPayload>(token.value);
      // console.log(decodedToken);
      return decodedToken;
      // return JSON.parse(window.atob(state.jwt.split('.')[1])) as UserData;
    } catch (e) {
      return undefined;
    }
  });
  const isGuest = computed(() => userData.value?.role === 'guest');
  const userId = computed(() => userData.value?.userId);
  const username = computed(() => userData.value?.username);
  const role = computed(() => userData.value?.role);
  /**
   * Has a user id. Can be any role, including guest.
   */
  const isAuthenticated = computed(() => !!userId.value);
  /**
   * Has a user id. Can be any role, except guest.
   */
  const isLoggedIn = computed(() => isAuthenticated.value && hasAtLeastSecurityLevel(role.value, 'user'));
  const routePrefix = computed(() => role.value && hasAtLeastSecurityLevel(role.value, 'admin') ? 'admin' : 'user');
  async function autoGuest() {
    await logout();
    await guestAutoToken((t) => token.value = t);
  }
  async function restoreFromSession(){
    if(!hasCookie.value){
      console.warn('You will need to have a cookie set in order to restore a persisted login session');
    }
    await userAutoToken((t) => token.value = t);

  }
  async function logout() {
    await authLogout();
    _reset();
  }
  async function login (username: string, password: string ) {
    await authLogin(username, password);
    hasCookie.value = browserHasCookie();
    await userAutoToken((t) => {
      // console.log('new token! ', t);
      token.value = t;
    });
  }

  return {
    isAuthenticated,
    isNotGuest: isLoggedIn,
    token,
    tokenOrThrow,
    hasCookie,
    userData,
    isGuest,
    userId,
    role,
    username,
    autoGuest,
    restoreFromSession,
    logout,
    login,
    routePrefix,
  };
});
