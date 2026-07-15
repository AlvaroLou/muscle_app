import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AD_REQUEST_OPTIONS, adUnitId } from '@/ads/adConfig';
import { getAdmob } from '@/ads/adModule';
import { useAds } from '@/ads/AdsProvider';

/**
 * Mini banner (Anchored Adaptive) exibido logo abaixo do Header nas telas fora
 * do fluxo de treino. Renderiza `null` (sem reservar espaço) quando: é Pro, o
 * SDK não está pronto, ou o anúncio falhou/não preencheu. Assim nunca sobra
 * área em branco.
 */
export function BannerAd() {
  const { ready } = useAds();
  const [failed, setFailed] = useState(false);
  const admob = getAdmob();

  if (!ready || !admob || failed) return null;

  const Native = admob.BannerAd;
  return (
    <View style={styles.wrap}>
      <Native
        unitId={adUnitId('banner')}
        size={admob.BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={AD_REQUEST_OPTIONS}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
