/** Stage — cinematic backdrop per area (photo or gradient) with a contrast veil and ambient wash. */
import type { ReactNode } from "react";

export function Stage({
  image,
  position = "70% 40%",
  dim = 0.82,
  children,
}: {
  image?: string;
  position?: string;
  /** Veil strength on the reading side (0–1). */
  dim?: number;
  children?: ReactNode;
}) {
  return (
    <div
      className="relative isolate min-h-full overflow-hidden"
      style={{ background: "var(--cx-bg)" }}
    >
      <div aria-hidden className="cx-stage-layer absolute inset-0 -z-10">
        {image ? (
          <img
            src={image}
            alt=""
            className="absolute inset-y-0 right-0 h-full w-[70%] object-cover"
            style={{ objectPosition: position }}
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(1200px 600px at 75% 15%, rgba(var(--ambient-rgb), .10), transparent 60%),
              linear-gradient(90deg, rgba(5,7,12,${dim + 0.14}) 0%, rgba(5,7,12,${dim - 0.04}) 42%, rgba(5,7,12,${dim - 0.47}) 100%),
              linear-gradient(0deg, rgba(5,7,12,1) 0%, rgba(5,7,12,.2) 55%, rgba(5,7,12,.55) 100%)`,
          }}
        />
        <div className="cx-ambient-line absolute inset-x-0 bottom-0" />
      </div>
      {children}
    </div>
  );
}
