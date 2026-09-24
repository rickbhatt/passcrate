import {
  GoogleSignin,
  type User,
} from "@react-native-google-signin/google-signin";

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
