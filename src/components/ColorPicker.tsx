import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fonts, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

// ---------- Conversões de cor ----------
interface RGB {
  r: number;
  g: number;
  b: number;
}
interface HSV {
  h: number; // 0..360
  s: number; // 0..1
  v: number; // 0..1
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  const to = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsv({ r, g, b }: RGB): HSV {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function hsvToRgb({ h, s, v }: HSV): RGB {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

const hsvToHex = (hsv: HSV) => rgbToHex(hsvToRgb(hsv));

const HUE_STOPS = [
  '#ff0000',
  '#ffff00',
  '#00ff00',
  '#00ffff',
  '#0000ff',
  '#ff00ff',
  '#ff0000',
] as const;

interface Props {
  value: string;
  /** Chamado ao soltar o dedo (aplica a cor). */
  onChange: (hex: string) => void;
  /** Início do arraste — use para desabilitar o scroll do container pai. */
  onInteractStart?: () => void;
  /** Fim do arraste — reabilite o scroll do container pai. */
  onInteractEnd?: () => void;
}

/**
 * Seletor de cor HSV (sem dependência nativa): área de saturação/brilho +
 * slider de matiz + HEX/RGB. A prévia atualiza em tempo real enquanto arrasta;
 * a cor é aplicada (`onChange`) ao soltar.
 */
export function ColorPicker({ value, onChange, onInteractStart, onInteractEnd }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [hsv, setHsv] = useState<HSV>(() => rgbToHsv(hexToRgb(value)));
  const hsvRef = useRef(hsv);
  hsvRef.current = hsv;
  const [svW, setSvW] = useState(0);
  const [svH, setSvH] = useState(0);
  const [hueW, setHueW] = useState(0);

  // Sincroniza quando a cor externa muda (ex.: tocar num swatch).
  useEffect(() => {
    setHsv(rgbToHsv(hexToRgb(value)));
  }, [value]);

  const currentHex = hsvToHex(hsv);
  const hueHex = hsvToHex({ h: hsv.h, s: 1, v: 1 });
  const rgb = hsvToRgb(hsv);

  const onSvLayout = (e: LayoutChangeEvent) => {
    setSvW(e.nativeEvent.layout.width);
    setSvH(e.nativeEvent.layout.height);
  };
  const onHueLayout = (e: LayoutChangeEvent) => setHueW(e.nativeEvent.layout.width);

  const handleSv = (e: GestureResponderEvent) => {
    if (svW <= 0 || svH <= 0) return;
    const { locationX, locationY } = e.nativeEvent;
    const s = clamp(locationX / svW, 0, 1);
    const v = 1 - clamp(locationY / svH, 0, 1);
    setHsv((prev) => ({ ...prev, s, v }));
  };

  const handleHue = (e: GestureResponderEvent) => {
    if (hueW <= 0) return;
    const h = clamp(e.nativeEvent.locationX / hueW, 0, 1) * 360;
    setHsv((prev) => ({ ...prev, h }));
  };

  const beginSv = (e: GestureResponderEvent) => {
    onInteractStart?.();
    handleSv(e);
  };
  const beginHue = (e: GestureResponderEvent) => {
    onInteractStart?.();
    handleHue(e);
  };
  const commit = () => {
    onChange(hsvToHex(hsvRef.current));
    onInteractEnd?.();
  };

  return (
    <View style={styles.wrap}>
      {/* Área saturação (x) × brilho (y) */}
      <View
        style={[styles.sv, { backgroundColor: hueHex }]}
        onLayout={onSvLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={beginSv}
        onResponderMove={handleSv}
        onResponderRelease={commit}
        onResponderTerminate={commit}
        onResponderTerminationRequest={() => false}
      >
        <LinearGradient
          colors={['#ffffff', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0)', '#000000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View
          pointerEvents="none"
          style={[
            styles.svThumb,
            { left: hsv.s * svW - 8, top: (1 - hsv.v) * svH - 8 },
          ]}
        />
      </View>

      {/* Slider de matiz */}
      <View
        style={styles.hue}
        onLayout={onHueLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={beginHue}
        onResponderMove={handleHue}
        onResponderRelease={commit}
        onResponderTerminate={commit}
        onResponderTerminationRequest={() => false}
      >
        <LinearGradient
          colors={HUE_STOPS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.hueGradient}
          pointerEvents="none"
        />
        <View pointerEvents="none" style={[styles.hueThumb, { left: (hsv.h / 360) * hueW - 8 }]} />
      </View>

      {/* Prévia + valores */}
      <View style={styles.readout}>
        <View style={[styles.preview, { backgroundColor: currentHex }]} />
        <View style={styles.values}>
          <Text style={styles.hex}>{currentHex.toUpperCase()}</Text>
          <Text style={styles.rgb}>
            RGB {Math.round(rgb.r)}, {Math.round(rgb.g)}, {Math.round(rgb.b)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      gap: 12,
      paddingVertical: 8,
    },
    sv: {
      width: '100%',
      aspectRatio: 1.6,
      borderRadius: 12,
      overflow: 'hidden',
    },
    svThumb: {
      position: 'absolute',
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#ffffff',
    },
    hue: {
      height: 20,
      justifyContent: 'center',
    },
    hueGradient: {
      height: 12,
      borderRadius: 6,
    },
    hueThumb: {
      position: 'absolute',
      top: 0,
      width: 16,
      height: 20,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#ffffff',
      backgroundColor: 'transparent',
    },
    readout: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    preview: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    values: {
      flex: 1,
    },
    hex: {
      color: colors.text,
      fontFamily: fonts.monoMed,
      fontSize: 16,
      letterSpacing: 1,
    },
    rgb: {
      color: colors.textSecondary,
      fontFamily: fonts.mono,
      fontSize: 12,
      marginTop: 2,
    },
  });
