import { AdMobBanner } from 'expo-ads-admob';
import Constants from 'expo-constants';
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

const extra = Constants.expoConfig?.extra ?? {};

const adUnitID =
  (extra.EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID as string | undefined) ??
  process.env.EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID;

export function FitnessAdMobBanner({
  style,
}: {
  style?: StyleProp<ViewStyle>;
}) {
  if (!adUnitID) return null;

  return (
    <View style={style}>
      <AdMobBanner
        adUnitID={adUnitID}
        bannerSize="smartBanner"
        servePersonalizedAds={false}
      />
    </View>
  );
}

