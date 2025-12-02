import { useEffect, useState } from "react";
import * as buffer from "buffer";
import {
  SlotMachine,
  SlotStatus,
} from "./components/slot-machine/slot-machine";
import { spin, collectWins } from "./core/transactions";
import {
  checkIfWalletConnected,
  connectWallet,
  getBalance,
} from "./core/wallet";
import { formatAddress } from "./core/utils";

import "./App.scss";

(window as any).Buffer = buffer.Buffer;

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [status, setStatus] = useState(SlotStatus.none);
  const [jackpot, setJackpot] = useState("0.00");
  const [balance, setBalance] = useState("0.00");
  const [winBalance, setWinBalance] = useState("0.00");

  useEffect(() => {
    const onLoad = async () => {
      const address = await checkIfWalletConnected();
      if (address) {
        setWalletAddress(address);
        updateBalance();
      }
    };
    onLoad();
  }, []);

  const updateBalance = async (onlyWallet = false) => {
    const res = await getBalance();
    if (res.balance) setBalance(res.balance);
    if (!onlyWallet && res.winBalance) setWinBalance(res.winBalance);
    if (res.vaultBalance) setJackpot(res.vaultBalance);
  };

  const spinIt = async () => {
    setStatus(SlotStatus.spin);

    if (!walletAddress) {
      console.log("⚠️ Wallet not connected - demo mode");
      setTimeout(() => {
        setStatus(
          Math.floor(Math.random() * 2) === 0
            ? SlotStatus.loose
            : SlotStatus.win1
        );
      }, 2000);
      return;
    }

    try {
      console.log("🎰 Spinning on devnet...");
      const result = await spin();

      // Update balance after spin
      await updateBalance(true);

      // Set status based on result
      switch (result) {
        case "1":
          setStatus(SlotStatus.win1);
          console.log("🎉 Small win!");
          break;
        case "2":
          setStatus(SlotStatus.win2);
          console.log("🎊 Big win!");
          break;
        case "3":
          setStatus(SlotStatus.win3);
          console.log("💎 MEGA WIN!");
          break;
        default:
          setStatus(SlotStatus.loose);
          console.log("😔 Better luck next time");
      }
    } catch (error: any) {
      console.error("❌ Spin failed:", error?.message || error);
      setStatus(SlotStatus.none);
      alert(`Spin failed: ${error?.message || "Unknown error"}\n\nCheck console for details.`);
    }
  };

  const handleConnect = async () => {
    try {
      console.log("👛 Connecting wallet...");
      const address = await connectWallet();
      if (address) {
        console.log(`✅ Connected: ${address}`);
        setWalletAddress(address);
        await updateBalance();
      }
    } catch (error: any) {
      console.error("❌ Connection failed:", error?.message || error);
      alert(`Failed to connect wallet: ${error?.message || "Unknown error"}\n\nMake sure Phantom wallet is installed.`);
    }
  };

  const handleCollect = async () => {
    try {
      console.log("💰 Collecting winnings...");
      const success = await collectWins();
      if (success) {
        console.log("✅ Winnings collected successfully!");
        await updateBalance();
      }
    } catch (error: any) {
      console.error("❌ Collect failed:", error?.message || error);
      alert(`Failed to collect winnings: ${error?.message || "Unknown error"}\n\nCheck console for details.`);
    }
  };

  return (
    <div className="App">
      <div className="header">
        {walletAddress ? (
          <div className="wallet-info">
            <span>◎{balance}</span>
            <span>{formatAddress(walletAddress)}</span>
          </div>
        ) : (
          <button className="button" onClick={handleConnect}>
            Connect Phantom Wallet
          </button>
        )}
      </div>
      <div className="cluster">Devnet</div>
      <div className="logo">
        <h1>🎰 Solana Slot Machine 🎰</h1>
      </div>
      <div className="container-positioner">
        <div className="slot-container">
          <SlotMachine
            onSpin={spinIt}
            status={status}
            winBalance={winBalance}
            jackpot={jackpot}
            walletAddress={walletAddress}
            collect={handleCollect}
            onSpinFinished={updateBalance}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
