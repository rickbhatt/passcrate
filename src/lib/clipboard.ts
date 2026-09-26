import SecureClipboard from "../../modules/secure-clipboard";

export const CLIPBOARD_CLEAR_DELAY_MS = 45_000;

// Copies a secret flagged as sensitive (masked in Android's copy preview and
// kept out of keyboard clipboard history) and wipes it after `delayMs`, unless
// the user has copied something else since. The timer runs natively so it
// still fires while the app is in the background.
export const copySensitiveText = (
  value: string,
  delayMs = CLIPBOARD_CLEAR_DELAY_MS,
) => SecureClipboard.setSensitiveStringAsync(value, delayMs);
