import Phaser from 'phaser';

function hashHue(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

export function ensureIconTexture(scene, key) {
  if (scene.textures.exists(`icon-${key}`)) {
    return;
  }
  const hue = hashHue(key);
  const secondaryHue = (hue + 180) % 360;
  const size = 128;
  const graphics = scene.add.graphics();
  graphics.fillStyle(Phaser.Display.Color.HSLToColor(hue / 360, 0.7, 0.45).color, 1);
  graphics.fillRoundedRect(0, 0, size, size, 32);
  graphics.lineStyle(6, Phaser.Display.Color.HSLToColor(secondaryHue / 360, 0.9, 0.6).color, 1);
  graphics.strokeRoundedRect(0, 0, size, size, 32);
  graphics.fillStyle(Phaser.Display.Color.HSLToColor((hue + 40) / 360, 0.8, 0.7).color, 0.8);
  graphics.beginPath();
  graphics.moveTo(size * 0.2, size * 0.75);
  graphics.lineTo(size * 0.5, size * 0.25);
  graphics.lineTo(size * 0.8, size * 0.75);
  graphics.closePath();
  graphics.fillPath();
  graphics.fillCircle(size * 0.5, size * 0.35, size * 0.12);
  graphics.generateTexture(`icon-${key}`, size, size);
  graphics.destroy();
}

export function generateIconAtlas(scene, keys) {
  keys.forEach((key) => ensureIconTexture(scene, key));
}
