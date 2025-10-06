import soundData from './soundData.json';

export function preloadAudio(scene) {
  Object.entries(soundData).forEach(([key, base64]) => {
    scene.load.audio(`sfx-${key}`, `data:audio/wav;base64,${base64}`);
  });
}

export function playSfx(scene, key) {
  const sound = scene.sound.get(`sfx-${key}`) || scene.sound.add(`sfx-${key}`);
  sound.play({ volume: 0.6 });
}
