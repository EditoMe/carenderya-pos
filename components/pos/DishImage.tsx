import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { useState } from 'react';

interface Props {
  /** Owner-uploaded photo (highest priority) */
  uri?: string;
  /** Photo bundled with the app (e.g. from the Figma prototype) */
  asset?: ImageSourcePropType;
  emoji: string;
  /** font size of the emoji fallback */
  size?: number;
  /** fill the parent (parent must have dimensions + overflow hidden) */
  fill?: boolean;
  box?: number;
}

/**
 * Priority: owner photo → bundled photo → built-in emoji art.
 * Broken/stale files fall back automatically.
 */
export function DishImage({ uri, asset, emoji, size = 52, fill, box = 48 }: Props) {
  // Remember WHICH uri failed so a newly set photo retries automatically.
  const [failedUri, setFailedUri] = useState<string | null>(null);

  const source = uri ? { uri } : asset;
  const failed = !source || (!!uri && failedUri === uri);

  if (failed) {
    return (
      <View style={[styles.fallback, fill && styles.fillCenter]}>
        <Text style={{ fontSize: size }}>{emoji}</Text>
      </View>
    );
  }

  if (fill) {
    return (
      <View style={styles.fill}>
        <Image
          source={source}
          style={styles.fillImg}
          resizeMode="cover"
          onError={() => {
            if (uri) setFailedUri(uri);
          }}
        />
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={{ width: box, height: box, borderRadius: box / 4 }}
      resizeMode="cover"
      onError={() => {
        if (uri) setFailedUri(uri);
      }}
    />
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  fillCenter: { flex: 1 },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  fillImg: { width: '100%', height: '100%' },
});
