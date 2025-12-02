import { useEffect, useRef, useState } from "react";
import "./reel.scss";

interface ReelProps {
  index: number;
  target: number;
  spin: number;
  onSpinFinished?: () => void;
}

export const Reel = ({ index, target, spin, onSpinFinished }: ReelProps) => {
  const w1 = useRef<HTMLDivElement>(null);
  const w2 = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState([0, 0]);

  useEffect(() => {
    if (spin > 0) {
      startAnimation();
    }
  }, [spin, target]);

  const startAnimation = () => {
    let executed = 0;
    let lastTime = Date.now();
    let animationId: number;

    const animate = () => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;

      if (!w1.current || !w2.current) return;

      const step = target < 0 ? 8 : 6 * ((target - executed) / target) + 2;
      executed += step;

      const newPositions = positions.map((pos) => {
        let newPos = pos + step;
        if (newPos > 400) {
          newPos -= 1600;
        }
        return newPos;
      });

      setPositions(newPositions);
      w1.current.style.top = `${newPositions[0]}px`;
      w2.current.style.top = `${newPositions[1]}px`;

      if (target > 0 && executed >= target) {
        cancelAnimationFrame(animationId);
        if (onSpinFinished) {
          onSpinFinished();
        }
      } else if (target < 0 || executed < target) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  };

  return (
    <div className={`reel reel-${index}`}>
      <div className="wheel" ref={w1}>
        <div className="item">💎</div>
        <div className="item">🍒</div>
        <div className="item">🍋</div>
        <div className="item">🍊</div>
        <div className="item">🍇</div>
        <div className="item">⭐</div>
        <div className="item">🔔</div>
        <div className="item">7️⃣</div>
        <div className="item">🍀</div>
        <div className="item">💰</div>
      </div>
      <div className="wheel" ref={w2} style={{ top: "400px" }}>
        <div className="item">💎</div>
        <div className="item">🍒</div>
        <div className="item">🍋</div>
        <div className="item">🍊</div>
        <div className="item">🍇</div>
        <div className="item">⭐</div>
        <div className="item">🔔</div>
        <div className="item">7️⃣</div>
        <div className="item">🍀</div>
        <div className="item">💰</div>
      </div>
    </div>
  );
};
