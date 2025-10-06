import Phaser from 'phaser';

export function ensureSparkParticle(scene) {
  if (scene.textures.exists('particle-spark')) {
    return 'particle-spark';
  }
  const size = 32;
  const gfx = scene.add.graphics({ x: 0, y: 0 });
  for (let radius = size / 2; radius > 0; radius -= 2) {
    const alpha = Phaser.Math.Clamp(radius / (size / 2), 0, 1);
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xffffff),
      Phaser.Display.Color.ValueToColor(0x00e7ff),
      size / 2,
      size / 2 - radius
    );
    const tint = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
    gfx.fillStyle(tint, alpha);
    gfx.fillCircle(size / 2, size / 2, radius);
  }
  gfx.generateTexture('particle-spark', size, size);
  gfx.destroy();
  return 'particle-spark';
}
