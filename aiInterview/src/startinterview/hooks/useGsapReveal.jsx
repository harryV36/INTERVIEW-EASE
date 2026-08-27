import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function useGsapReveal({ stagger = 0.15, from = 40 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const elements = gsap.utils.toArray(".reveal");

      gsap.set(elements, { y: from, opacity: 0 });

      gsap.to(elements, {
        y: 0,
        opacity: 1,
        stagger,
        duration: 0.6,
        ease: "power3.out",
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return ref;
}
