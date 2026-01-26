export interface Particle {
  x: number;
  y: number;
  speed: number;
  direction: number;
  life: number; // Current life
  decay: number; // Fade speed
  // properties from PIXI.Graphics (partial)
  circle: (x: number, y: number, radius: number) => void;
  fill: (color: number | { color: number }) => void;
  tint: number;
  alpha: number;
  scale: { x: number; y: number; set: (v: number) => void };
  anchor: { set: (v: number) => void };
  visible: boolean;
}
