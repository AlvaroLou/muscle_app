import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';

/**
 * Mídia de exercícios (Pro): escolher um vídeo da galeria, copiá-lo para o
 * armazenamento do app (persistente) e gerar uma miniatura. Estruturado para,
 * no futuro, sincronizar/backup na nuvem (basta trocar o destino). Falhas de
 * thumbnail são toleradas (o thumbnail é opcional).
 */
export interface ExerciseMedia {
  videoUri: string;
  thumbnailUri?: string;
}

const MEDIA_DIR = `${FileSystem.documentDirectory}exercise_media/`;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MEDIA_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
  }
}

/**
 * Abre a galeria, valida (só vídeos), copia para o app e gera miniatura.
 * Retorna null se o usuário cancelar ou negar a permissão.
 */
export async function pickExerciseVideo(): Promise<ExerciseMedia | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    quality: 1,
  });
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  await ensureDir();

  const ext = (asset.uri.split('?')[0].split('.').pop() || 'mp4').toLowerCase();
  const stamp = Date.now();
  const videoUri = `${MEDIA_DIR}${stamp}.${ext}`;
  await FileSystem.copyAsync({ from: asset.uri, to: videoUri });

  let thumbnailUri: string | undefined;
  try {
    const thumb = await VideoThumbnails.getThumbnailAsync(videoUri, { time: 1000 });
    const dest = `${MEDIA_DIR}${stamp}_thumb.jpg`;
    await FileSystem.copyAsync({ from: thumb.uri, to: dest });
    thumbnailUri = dest;
  } catch {
    // Miniatura é opcional (pode não estar disponível em alguns ambientes).
  }

  return { videoUri, thumbnailUri };
}

/** Remove os arquivos de mídia do dispositivo (idempotente). */
export async function removeExerciseMedia(media: Partial<ExerciseMedia>): Promise<void> {
  for (const uri of [media.videoUri, media.thumbnailUri]) {
    if (!uri) continue;
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      // ignora — não deve interromper o fluxo
    }
  }
}
