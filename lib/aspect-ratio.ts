export function toCssAspectRatio(aspectRatio: string): string {
  if (!aspectRatio.includes(':')) {
    return aspectRatio;
  }

  const [width, height] = aspectRatio.split(':').map((part) => part.trim());
  if (!width || !height) {
    return aspectRatio;
  }

  return `${width} / ${height}`;
}
