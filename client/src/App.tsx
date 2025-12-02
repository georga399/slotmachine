import { useEffect, useState } from "react";
import * as buffer from "buffer";
import {
  SlotMachine,
  SlotStatus,
} from "./components/slot-machine/slot-machine";
import { initVault, spin, collectWins } from "./core/transactions";
import {
  checkIfWalletConnected,
  connectWallet,
  getBalance,
  waitForPhantom,
} from "./core/wallet";
import { ReactComponent as WalletSvg } from "./img/wallet.svg";

import "./App.scss";
import { formatAddress } from "./core/utils";
window.Buffer = buffer.Buffer;

function App() {
  const [walletAddress, setWalletAdresss] = useState("");
  const [status, setStatus] = useState(SlotStatus.none);
  const [jackpot, setJackpot] = useState("");
  const [balance, setBalance] = useState("");
  const [winBalance, setWinBalance] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkPhantomAvailability = () => {
      console.log("=== Phantom Detection ===");
      console.log("window.solana:", window.solana);
      console.log("window.solana?.isPhantom:", window.solana?.isPhantom);
      console.log("========================");
    };

    const onLoad = async () => {
      console.log("Page loaded, checking for wallet connection...");
      checkPhantomAvailability();

      const address = await checkIfWalletConnected();
      if (address) {
        console.log("Wallet auto-connected with address:", address);
        setWalletAdresss(address as string);
        updateBalance();
      } else {
        console.log("No wallet auto-connected");
      }
    };

    // Check immediately if page is already loaded
    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
    }

    // Also check on a short delay in case Phantom loads after page
    const phantomCheckTimeout = setTimeout(() => {
      checkPhantomAvailability();
    }, 1000);

    // Handle account changes
    const setupWalletListeners = () => {
      if (window.solana) {
        window.solana.on("accountChanged", (publicKey: any) => {
          if (publicKey) {
            console.log("Account changed to:", publicKey.toString());
            setWalletAdresss(publicKey.toString());
            updateBalance();
          } else {
            console.log("Account disconnected");
            setWalletAdresss("");
          }
        });

        window.solana.on("disconnect", () => {
          console.log("Wallet disconnected");
          setWalletAdresss("");
        });
      }
    };

    setupWalletListeners();

    return () => {
      window.removeEventListener("load", onLoad);
      clearTimeout(phantomCheckTimeout);
    };
  }, []);

  const updateBalance = (onlyWallet = false) => {
    getBalance().then((res) => {
      res.balance && setBalance(res.balance);
      if (!onlyWallet) {
        res.winBalance && setWinBalance(res.winBalance);
      }
      if(res.vaultBalance) {
        setJackpot(res.vaultBalance)
      }
    });
  };

  const spinIt = () => {
    setStatus(SlotStatus.spin);

    // demo spin
    if (!walletAddress) {
      setTimeout(() => {
        setStatus(
          Math.floor(Math.random() * 2) === 0
            ? SlotStatus.loose
            : SlotStatus.win1
        );
      }, 2000);

      return;
    }
    spin().then((result) => {
      updateBalance(true);
      switch (result) {
        case "1":
          setStatus(SlotStatus.win1);
          break;
        case "2":
          setStatus(SlotStatus.win2);
          break;
        case "3":
          setStatus(SlotStatus.win3);
          break;

        default:
          setStatus(SlotStatus.loose);
      }
    });
  };

  return (
    <div className="App">
      <div className="header">
        {walletAddress && (
          <div className="wallet-info">
            {balance}
            <WalletSvg />
            {formatAddress(walletAddress)}
          </div>
        )}
        {!walletAddress && (
          <button
            className="button"
            disabled={isConnecting}
            onClick={async () => {
              console.log("Connect button clicked");
              setIsConnecting(true);
              try {
                const address = await connectWallet();
                console.log("Received address:", address);
                if (address) {
                  setWalletAdresss(address);
                  await updateBalance();
                }
              } catch (error) {
                console.error("Error in button handler:", error);
              } finally {
                setIsConnecting(false);
              }
            }}
          >
            {isConnecting ? "Connecting..." : "Connect Phantom Wallet"}
          </button>
        )}
      </div>
      <div className="cluster">devnet</div>
      <div className="logo">
        <div className="bandit-text">
          <div className="slot-machine-title">Slotmachine</div>
          aka ОДНОРУКИЙ БАНДИТ
        </div>
      </div>
      <div className="contaner-positioner">
        <div className="slot-container">
          <SlotMachine
            onSpin={spinIt}
            status={status}
            winBalance={winBalance}
            jackpot={jackpot}
            walletAddress={walletAddress}
            collect={() => {
              collectWins().then(() => {
                updateBalance();
              });
            }}
            onSpinFinished={() => {
              updateBalance();
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
