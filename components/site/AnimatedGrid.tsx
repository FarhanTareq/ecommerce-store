"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type AnimatedGridProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "rise" | "featured";
};

export default function AnimatedGrid({
  children,
  className,
  variant = "rise",
}: AnimatedGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setVisible(true), 0);
      return () => window.clearTimeout(timer);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal={visible ? "in" : "out"}
      className={cn(
        "reveal-grid",
        variant === "featured" && "featured-grid",
        className,
      )}
    >
      {children}
    </div>
  );
}
