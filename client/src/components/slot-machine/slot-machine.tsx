import { useState } from "react";
import { SlotScreen } from "../slot-screen/slot-screen";
import { Lever } from "../lever/lever";
import { Blank } from "../blank/blank";
import "./slot-machine.scss";

export enum SlotStatus {
  none = "none",
  spin = "spin",
  loose = "loose",
  win1 = "win1",
  win2 = "win2",
  win3 = "win3",
}

interface SlotMachineProps {
  onSpin: () => void;
  status: SlotStatus;
  winBalance: string;
  jackpot: string;
  walletAddress: string;
  collect: () => void;
  onSpinFinished: () => void;
}

export const SlotMachine = ({
  onSpin,
  status,
  winBalance,
  jackpot,
  walletAddress,
  collect,
  onSpinFinished,
}: SlotMachineProps) => {
  const [spin, setSpin] = useState(0);
  const [allowSpin, setAllowSpin] = useState(true);
  const [message, setMessage] = useState("");

  const handleSpin = () => {
    if (!allowSpin) {
      return;
    }

    if (!walletAddress) {
      setMessage("Please connect your wallet first!");
      return;
    }

    setAllowSpin(false);
    setSpin(spin + 1);
    setMessage("");
    onSpin();
  };

  const handleSpinFinished = () => {
    setAllowSpin(true);
    onSpinFinished();

    switch (status) {
      case SlotStatus.win3:
        setMessage("🎉 MEGA WIN! You won 0.2 SOL!");
        break;
      case SlotStatus.win2:
        setMessage("🎊 BIG WIN! You won 0.1 SOL!");
        break;
      case SlotStatus.win1:
        setMessage("✨ Small win! You won 0.05 SOL!");
        break;
      case SlotStatus.loose:
        setMessage("Better luck next time!");
        break;
    }
  };

  return (
    <div className="slot-machine">
      <div className="info-panel">
        <Blank text={`Jackpot: ◎${jackpot}`} />
        <Blank text={`Your Winnings: ◎${winBalance}`} />
      </div>

      <div className="game-area">
        <SlotScreen
          spin={spin}
          onSpinFinished={handleSpinFinished}
          status={status}
        />
        <Lever onSpin={handleSpin} />
      </div>

      {message && <div className="message">{message}</div>}

      {parseFloat(winBalance) > 0.001 && walletAddress && (
        <div className="collect-container">
          <button className="collect-button" onClick={collect}>
            COLLECT WINNINGS
          </button>
        </div>
      )}
    </div>
  );
};
