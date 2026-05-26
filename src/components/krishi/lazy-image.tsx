import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type LazyImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  /** className applied to the wrapping container (sizing, rounded, etc.) */
  wrapperClassName?: string;
  /** Mark this image as the LCP/above-the-fold image. Defaults to false (lazy). */
  priority?: boolean;
};

/**
 * LazyImage — lazy-loaded image with skeleton placeholder and error fallback.
 * Use this for all remote/user-content images. For decorative tiny icons, plain
 * <img> is fine.
 */
export function LazyImage({
  src,
  alt,
  className,
  width,
  height,
  wrapperClassName,
  priority = false,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-primary/5", wrapperClassName)}>
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-primary/10" aria-hidden />
      )}
      {error || !src ? (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <ImageOff className="h-5 w-5" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
        />
      )}
    </div>
  );
}
