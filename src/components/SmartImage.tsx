import { useState, type ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  skeletonClassName?: string;
  /** Optional AVIF source for a <picture> wrapper. */
  avifSrc?: string;
  /** Optional WebP source for a <picture> wrapper. */
  webpSrc?: string;
};

/**
 * Image with a shimmer/skeleton placeholder to minimize CLS and improve
 * perceived performance. Renders a <picture> when avifSrc/webpSrc are
 * provided so browsers can pick the smallest supported format.
 */
export function SmartImage({
  className = "",
  skeletonClassName = "",
  onLoad,
  avifSrc,
  webpSrc,
  src,
  ...rest
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const img = (
    <img
      {...rest}
      src={src}
      onLoad={(e) => { setLoaded(true); onLoad?.(e); }}
      className={`${className} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
    />
  );
  return (
    <span className="relative block h-full w-full overflow-hidden">
      {!loaded && (
        <span
          aria-hidden
          className={`absolute inset-0 animate-pulse bg-gradient-to-br from-surface via-accent/40 to-surface ${skeletonClassName}`}
        />
      )}
      {avifSrc || webpSrc ? (
        <picture>
          {avifSrc && <source srcSet={avifSrc} type="image/avif" />}
          {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
          {img}
        </picture>
      ) : (
        img
      )}
    </span>
  );
}
