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
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: getUniqueIdentifier(),
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#208AEF",
        android: {
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
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
    "expo-secure-store",
    "@react-native-google-signin/google-signin",
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
