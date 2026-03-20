require('dotenv').config();

const appJson = require('./app.json');

const admobAndroidAppId =
  process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID ?? 'ca-app-pub-3940256099942544~3347511713';
const admobIosAppId =
  process.env.EXPO_PUBLIC_ADMOB_APP_ID_IOS ?? 'ca-app-pub-3940256099942544~1458002511';
const admobBannerAdUnitId =
  process.env.EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID ?? 'ca-app-pub-3940256099942544/6300978111';

const existingPlugins = appJson.expo.plugins ?? [];
const hasAdmobPlugin = existingPlugins.some((p) => (Array.isArray(p) ? p[0] : p) === 'expo-ads-admob');
const plugins = hasAdmobPlugin
  ? existingPlugins
  : [
      ...existingPlugins,
      ['expo-ads-admob', { androidAppId: admobAndroidAppId, iosAppId: admobIosAppId }],
    ];

module.exports = () => ({
  expo: {
    ...appJson.expo,
    plugins,
    extra: {
      ...appJson.expo?.extra,
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_ADMOB_APP_ID_ANDROID: admobAndroidAppId,
      EXPO_PUBLIC_ADMOB_APP_ID_IOS: admobIosAppId,
      EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID: admobBannerAdUnitId,
    },
  },
});
