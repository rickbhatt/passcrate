import { ConfigContext, ExpoConfig } from "expo/config";

const variant = process.env.APP_VARIANT;

const getUniqueIdentifier = () => {
  switch (variant) {
    case "development":
      return "com.ritankar.passcrate.dev";
    case "preview":
      return "com.ritankar.passcrate.preview";
    default:
      return "com.ritankar.passcrate";
  }
};

const getAppName = () => {
  switch (variant) {
    case "development":
      return "PassCrate Dev";
    case "preview":
      return "PassCrate Preview";
    default:
      return "PassCrate";
  }
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "passcrate",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "passcrate",
  userInterfaceStyle: "automatic",
  ios: {
    icon: "./assets/expo.icon",
    bundleIdentifier: getUniqueIdentifier(),
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#ffffff",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: getUniqueIdentifier(),
    // Encrypted Google Drive backups are the only backup. Android Auto Backup
    // would silently restore the DB on reinstall and skip the restore prompt.
    allowBackup: false,
  },
  plugins: [
    "expo-router",
    "expo-image",
    "expo-web-browser",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon-dark.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#FAF9F6",
        dark: {
          backgroundColor: "#0D0D0F",
          image: "./assets/images/splash-icon-light.png",
        },
      },
    ],
    [
      "expo-font",
      {
        fonts: [
          "./assets/fonts/PlusJakartaSans-Regular.ttf",
          "./assets/fonts/PlusJakartaSans-Bold.ttf",
          "./assets/fonts/PlusJakartaSans-Medium.ttf",
          "./assets/fonts/PlusJakartaSans-SemiBold.ttf",
          "./assets/fonts/PlusJakartaSans-ExtraBold.ttf",
          "./assets/fonts/PlusJakartaSans-Light.ttf",
        ],
      },
    ],
    "expo-sqlite",
    [
      "expo-secure-store",
      {
        configureAndroidBackup: true,
        faceIDPermission:
          "Allow $(PRODUCT_NAME) to access your Face ID biometric data.",
      },
    ],
    "@react-native-google-signin/google-signin",
    [
      "expo-notifications",
      {
        // Android draws only the alpha channel: must be white on transparent.
        icon: "./assets/images/notification-icon.png",
        color: "#C87932",
        defaultChannel: "backup",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "0cf658bc-28e5-41f8-8161-33bda273662e",
    },
  },
  owner: "ritankar",
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: "https://u.expo.dev/0cf658bc-28e5-41f8-8161-33bda273662e",
  },
});
