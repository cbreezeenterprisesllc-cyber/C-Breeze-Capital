import type { CapacitorConfig } from "@capacitor/cli";

const LIVE_BACKEND_URL =
  "https://ef5d2c4ae9113753571b85ddf95ab4dd.ctonew.app";

const config: CapacitorConfig = {
  appId: "com.greenexpress.delivery",
  appName: "GreenExpress",
  webDir: "dist/client",

  // iOS-specific
  ios: {
    scheme: "GreenExpress",
    contentInset: "automatic",
    scrollEnabled: true,
    allowsLinkPreview: false,
  },

  // Android-specific
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  server: {
    cleartext: true,
  },

  plugins: {
    Camera: {
      usageDescription: "Used to scan customer IDs for age verification",
    },
    Geolocation: {
      usageDescription: "Used to track deliveries and provide accurate ETAs",
    },
  },
};

export default config;