import { Dialog, QDialogOptions } from 'quasar';

export async function asyncDialog (options: QDialogOptions, timeoutMillis?: number): Promise<unknown> {
  const dialogPromise = new Promise((resolve, reject) => {
    const dialog = Dialog.create(options);
    let timer: number;
    if (timeoutMillis) {
      timer = window.setTimeout(() => {
        reject();
        dialog.hide();
      }, timeoutMillis);
    }

    dialog.onOk((payload) => {
      console.log('dialog was okayed');
      clearTimeout(timer);
      resolve(payload);
    }).onCancel(() => {
      console.log('dialog was canceled');
      reject();
    }).onDismiss(() => {
      console.log('dialog was dismissed');
      reject();
    });
  });
  return dialogPromise;
}
