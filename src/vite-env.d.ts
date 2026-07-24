/// <reference types="vite/client" />

declare module "*.png?format=avif&quality=70" {
  const src: string;
  export default src;
}
declare module "*.png?format=webp&quality=80" {
  const src: string;
  export default src;
}
// Responsive srcset variants from vite-imagetools (returns a srcset string).
declare module "*&as=srcset" {
  const srcset: string;
  export default srcset;
}
