import { NativeModule, requireNativeModule } from "expo";

declare class SecureClipboardModule extends NativeModule {
  setSensitiveStringAsync(content: string, clearAfterMs: number): Promise<void>;
  clearAsync(): Promise<void>;
}

// Android only. Throws on load if the dev client hasn't been rebuilt since
// this module was added — run `bun run prebuild` then `bun run android`.
export default requireNativeModule<SecureClipboardModule>("SecureClipboard");
