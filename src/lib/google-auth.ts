import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
  type User,
} from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";
import { toast } from "sonner-native";

export type GoogleUser = User["user"];

/** Hidden, app-private Drive folder — where encrypted backups will live. */
export const DRIVE_APPDATA_SCOPE =
  "https://www.googleapis.com/auth/drive.appdata";

let isConfigured = false;

/** Safe to call repeatedly; `GoogleSignin.configure` only runs once. */
export const configureGoogleSignIn = () => {
  if (isConfigured) return;

  GoogleSignin.configure({
    scopes: [DRIVE_APPDATA_SCOPE],
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
  isConfigured = true;
};

/** Whether a Google account is connected (persists across app restarts). */
export const isGoogleSignedIn = () => {
  configureGoogleSignIn();
  return GoogleSignin.hasPreviousSignIn();
};

/**
 * The connected Google account, or `null` if none. Uses the in-memory user
 * when available, otherwise restores the session without any UI.
 */
export const getGoogleUser = async (): Promise<GoogleUser | null> => {
  if (!isGoogleSignedIn()) return null;

  const cached = GoogleSignin.getCurrentUser();
  if (cached) return cached.user;

  const response = await GoogleSignin.signInSilently();
  return response.type === "success" ? response.data.user : null;
};

/**
 * Interactive sign-in with Drive access. Shows its own error toasts and
 * returns `null` when cancelled or failed. The account picker backgrounds
 * the app, so callers must suppress the vault auto-lock around this.
 */
export const signInWithGoogle = async (): Promise<GoogleUser | null> => {
  try {
    configureGoogleSignIn();
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }

    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null;

    // The user can untick Drive access on the consent screen.
    if (!response.data.scopes.includes(DRIVE_APPDATA_SCOPE)) {
      const scoped = await GoogleSignin.addScopes({
        scopes: [DRIVE_APPDATA_SCOPE],
      });
      if (!scoped || !isSuccessResponse(scoped)) {
        await GoogleSignin.signOut();
        toast.error("Drive access is required for backups");
        return null;
      }
    }

    return response.data.user;
  } catch (error) {
    console.error(error);
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.IN_PROGRESS:
          return null;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          toast.error("Google Play Services is unavailable or outdated");
          return null;
      }
    }
    toast.error("Couldn't connect your Google account. Please try again.");
    return null;
  }
};

/** Revokes Drive access and signs out, so the next connect asks again. */
export const signOutGoogle = async () => {
  await GoogleSignin.revokeAccess().catch(() => null);
  await GoogleSignin.signOut();
};

/** A fresh OAuth access token for Drive REST calls. */
export const getAccessToken = async () => {
  const user = await getGoogleUser();
  if (!user) throw new Error("No Google account connected");

  const { accessToken } = await GoogleSignin.getTokens();
  return accessToken;
};
