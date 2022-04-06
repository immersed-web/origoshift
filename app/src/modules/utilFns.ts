import { Dialog, QDialogOptions } from 'quasar';

export async function asyncDialog (options: QDialogOptions): Promise<unknown> {
  const dialogPromise = new Promise((resolve, reject) => {
    Dialog.create(options).onOk((payload) => {
      resolve(payload);
    }).onCancel(() => {
      reject();
    }).onDismiss(() => {
      reject();
    });
  });
  return dialogPromise;
}
