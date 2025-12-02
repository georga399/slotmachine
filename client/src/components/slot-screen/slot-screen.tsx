import { useEffect, useState } from "react";
import { Reel } from "../reel/reel";
import { SlotStatus } from "../slot-machine/slot-machine";
import "./slot-screen.scss";

interface SlotScreenProps {
  spin: number;
  onSpinFinished: () => void;
  status: SlotStatus;
}

export const SlotScreen = ({ spin, onSpinFinished, status }: SlotScreenProps) => {
  const [targets, setTargets] = useState([-1, -1, -1]);

  const reels = [
    [5, 2, 9, 1, 6, 3, 8, 0, 7, 4],
    [3, 7, 1, 5, 9, 2, 6, 0, 8, 4],
    [8, 4, 2, 6, 0, 7, 3, 9, 1, 5],
  ];

  useEffect(() => {
    if (status === SlotStatus.spin) {
      setTargets([-1, -1, -1]);
      return;
    }

    let newTargets = [-1, -1, -1];

    if (status === SlotStatus.loose) {
      newTargets = [
        Math.floor(Math.random() * 7) * 40,
        Math.floor(Math.random() * 7) * 40,
        Math.floor(Math.random() * 7) * 40,
      ];
    } else if (status === SlotStatus.win1) {
      const symbolIndex = 5;
      const symbol = reels[0][symbolIndex];
      newTargets = [
        reels[0].indexOf(symbol, symbolIndex) * 40,
        reels[1].indexOf(symbol, 8) * 40,
        Math.floor(Math.random() * 7) * 40,
      ];
    } else if (status === SlotStatus.win2) {
      const symbolIndex = 4;
      const symbol = reels[0][symbolIndex];
      newTargets = [
        reels[0].indexOf(symbol, symbolIndex) * 40,
        reels[1].indexOf(symbol) * 40,
        reels[2].indexOf(symbol) * 40,
      ];
    } else if (status === SlotStatus.win3) {
      const symbolIndex = 4;
      const symbol = reels[0][symbolIndex];
      newTargets = [
        reels[0].indexOf(symbol, symbolIndex) * 40,
        reels[1].indexOf(symbol) * 40,
        reels[2].indexOf(symbol) * 40,
      ];
    }

    setTargets(newTargets.map((t) => t + 2000));
  }, [status]);

  return (
    <div className="slot-screen">
      <Reel index={0} target={targets[0]} spin={spin} />
      <Reel index={1} target={targets[1]} spin={spin} />
      <Reel
        index={2}
        target={targets[2]}
        spin={spin}
        onSpinFinished={onSpinFinished}
      />
    </div>
  );
};
