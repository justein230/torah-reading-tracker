import { Share, type ShareOptions } from '@capacitor/share';
import { errText } from './errText.js';

// The Share plugin rejects with this message when the share sheet is dismissed without picking
// a target (Android's chooser returns RESULT_CANCELED, iOS's activity sheet completes unfinished).
const SHARE_CANCELED = 'Share canceled';

export function isShareCanceled(err: unknown): boolean {
  return typeof err === 'object' && err !== null && errText(err) === SHARE_CANCELED;
}

// Opens the native share sheet. Backing out of it is the user's choice, not a failure, so it
// resolves instead of rejecting; any other error still propagates.
export async function shareFile(options: ShareOptions): Promise<void> {
  try {
    await Share.share(options);
  } catch (err) {
    if (!isShareCanceled(err)) throw err;
  }
}
