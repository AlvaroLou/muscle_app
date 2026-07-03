/**
 * Gerador de IDs simples e sem dependências. Combina timestamp + aleatório
 * para evitar colisões em criações rápidas.
 */
export function createId(prefix = ''): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}${time}${rand}`;
}
