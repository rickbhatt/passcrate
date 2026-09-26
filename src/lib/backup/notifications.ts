import { BACKUP } from "@/constants/backup";
import { format } from "date-fns";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Backup notifications are informational; show them even while the app is
// in the foreground (that's where manual and auto backups run).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let isChannelReady = false;

const ensureChannel = async () => {
  if (isChannelReady || Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(BACKUP.CHANNEL_ID, {
    name: "Backups",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
    vibrationPattern: null,
    enableVibrate: false,
  });
  isChannelReady = true;
};

let setupPromise: Promise<void> | null = null;

/**
 * Creates the channel and asks for notification permission (Android 13+ /
 * iOS). Runs once per launch, right after unlock, so the answer is in before
 * any backup starts.
 */
export const setupBackupNotifications = () => {
  setupPromise ??= (async () => {
    try {
      await ensureChannel();
      const { granted, canAskAgain } =
        await Notifications.getPermissionsAsync();
      if (!granted && canAskAgain) {
        await Notifications.requestPermissionsAsync();
      }
    } catch (error) {
      console.error("setupBackupNotifications: FAILED", error);
    }
  })();
  return setupPromise;
};

/** Notifications are best-effort: a denied permission never fails a backup. */
const present = async (
  content: Notifications.NotificationContentInput,
  identifier?: string,
) => {
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return;
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      identifier,
      content,
      trigger:
        Platform.OS === "android" ? { channelId: BACKUP.CHANNEL_ID } : null,
    });
  } catch (error) {
    console.error("backup notification: FAILED", error);
  }
};

const dismissProgress = () =>
  Notifications.dismissNotificationAsync(BACKUP.NOTIFICATION_ID).catch(
    () => null,
  );

export const showBackupInProgress = () =>
  present(
    {
      title: "Backing up your vault",
      body: "Uploading an encrypted backup to Google Drive…",
      sticky: true,
      autoDismiss: false,
    },
    BACKUP.NOTIFICATION_ID,
  );

export const showBackupSuccess = async (date: Date) => {
  await dismissProgress();
  await present({
    title: "Backup complete",
    body: `Your vault was backed up to Google Drive at ${format(date, "h:mm a")}.`,
  });
};

export const showBackupFailed = async () => {
  await dismissProgress();
  await present({
    title: "Backup failed",
    body: "Couldn't back up your vault. Open PassCrate to try again.",
  });
};
