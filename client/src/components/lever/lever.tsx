import { useState } from "react";
import "./lever.scss";

interface LeverProps {
  onSpin: () => void;
}

export const Lever = ({ onSpin }: LeverProps) => {
  const [pulled, setPulled] = useState(false);

  const handleClick = () => {
    if (!pulled) {
      setPulled(true);
      onSpin();
    }
  };

  return (
    <div className={`lever-container ${pulled ? "pulled" : ""}`}>
      <div className="bulb"></div>
      <div
        className="arm"
        onClick={handleClick}
        onAnimationEnd={() => setPulled(false)}
      ></div>
    </div>
  );
};
