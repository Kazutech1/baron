"use client";

import { useRef, useState } from "react";
import { useCart, type CartItem } from "./CartProvider";

export default function AddToCartButton({
  item,
  className = "",
}: {
  item: Omit<CartItem, "qty">;
  className?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleClick() {
    add(item);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1400);
  }

  return (
    <button
      onClick={handleClick}
      className={`clip-btn hud-label px-4 py-2 text-[11px] font-bold transition ${
        added
          ? "bg-volt text-night-950"
          : "border border-neon/60 bg-neon/10 text-neon hover:bg-neon/20"
      } ${className}`}
    >
      {added ? "Added ✓" : "Add to cart"}
    </button>
  );
}
