export const DEFAULT_HERO_MEDIA_SRC = "/omahub_hero.mp4";

const VIDEO_EXTENSION = /\.(mp4|webm|mov|m4v)$/i;

/** True when the homepage hero should play as a looping film instead of a still. */
export function isHeroVideoSrc(src: string): boolean {
  const path = src.split("?")[0].split("#")[0].toLowerCase();
  return VIDEO_EXTENSION.test(path);
}
