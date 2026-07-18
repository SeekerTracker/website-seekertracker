"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Pack3D.module.css";

type Pack3DProps = {
  /** Front art — pre-rendered pack WebP/JPG with logo baked in */
  src?: string;
  alt?: string;
  /** Optional: show multiple packs in a fan (Jupiter-style) */
  count?: number;
  onOpen?: () => void;
  className?: string;
};

/**
 * Jupiter-style pack stage: CSS 3D perspective + drag-to-spin.
 * Not WebGL — the "3D look" is the rendered pack image + rotateY.
 */
export default function Pack3D({
  src = "/packs/seeker-gold.jpg",
  alt = "Seeker Tracker pack",
  count = 5,
  onOpen,
  className = "",
}: Pack3DProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [rotY, setRotY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ active: false, lastX: 0, vel: 0 });
  const rotRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Keep rotRef in sync for inertia without re-subscribing
  useEffect(() => {
    rotRef.current = rotY;
  }, [rotY]);

  const applyInertia = useCallback(() => {
    const tick = () => {
      if (Math.abs(drag.current.vel) < 0.05) {
        drag.current.vel = 0;
        rafRef.current = null;
        return;
      }
      drag.current.vel *= 0.94;
      rotRef.current += drag.current.vel;
      setRotY(rotRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { active: true, lastX: e.clientX, vel: 0 };
    setDragging(true);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.lastX;
    drag.current.lastX = e.clientX;
    drag.current.vel = dx * 0.45;
    rotRef.current += drag.current.vel;
    setRotY(rotRef.current);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* */
    }
    applyInertia();
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Fan indices: center = 0, left negative, right positive
  const half = Math.floor((count - 1) / 2);
  const indices = Array.from({ length: count }, (_, i) => i - half);

  return (
    <div className={`${styles.wrap} ${className}`}>
      <div
        ref={stageRef}
        className={styles.stage}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="img"
        aria-label={alt}
      >
        {indices.map((i) => {
          // Base fan angle + drag spin (only center pack tracks full drag strongly)
          const fanAngle = i * 18;
          const depth = Math.abs(i);
          const scale = 1 - depth * 0.08;
          const x = i * 72;
          const z = -depth * 40;
          const opacity = 1 - depth * 0.18;
          const isCenter = i === 0;
          const yRot = isCenter ? rotY : fanAngle + rotY * 0.15;

          return (
            <div
              key={i}
              className={styles.pack}
              style={{
                transform: `translate(-50%, -50%) translate3d(${x}px, 0, ${z}px) rotateY(${yRot}deg) scale(${scale})`,
                opacity,
                zIndex: 100 - depth,
                transition: dragging
                  ? "none"
                  : "transform 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 400ms",
                pointerEvents: isCenter ? "auto" : "none",
                filter: depth > 0 ? "brightness(0.75) saturate(0.9)" : "none",
              }}
              onClick={() => {
                if (isCenter && Math.abs(drag.current.vel) < 0.5) onOpen?.();
              }}
            >
              <div className={styles.packInner}>
                <img
                  src={src}
                  alt={isCenter ? alt : ""}
                  draggable={false}
                  className={styles.art}
                />
                {/* floor reflection */}
                <img
                  src={src}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className={styles.reflection}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className={styles.hint}>Drag to spin · tap center pack to open</p>
    </div>
  );
}
