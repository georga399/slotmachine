import { PublicKey } from "@solana/web3.js";
import { getProvider } from "./conn";
import { lamportsToSol } from "./utils";
import idl from "../slots.json";
import { Program } from "@project-serum/anchor";

const programID = new PublicKey(idl.metadata.address);

// Wait for Phantom to be ready
export const waitForPhantom = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.solana?.isPhantom) {
      resolve(true);
      return;
    }

    let attempts = 0;
    const maxAttempts = 50; // 5 seconds
    const interval = setInterval(() => {
      attempts++;
      if (window.solana?.isPhantom) {
        clearInterval(interval);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        resolve(false);
      }
    }, 100);
  });
};

export const checkIfWalletConnected = async () => {
  const { solana } = window;
  return new Promise(async (resolve, reject) => {
    try {
      if (solana && solana.isPhantom) {
        const response = await solana.connect({
          onlyIfTrusted: true,
        });
        console.log("Connected to wallet:", response.publicKey.toString());
        resolve(response.publicKey.toString());
      } else {
        console.log("Phantom wallet not found");
        resolve("");
      }
    } catch (err) {
      console.error("Error checking wallet connection:", err);
      resolve("");
    }
  });
};

export const connectWallet = async () => {
  try {
    console.log("Attempting to connect to Phantom wallet...");

    // Wait for Phantom to be ready
    const isPhantomReady = await waitForPhantom();

    if (!isPhantomReady) {
      console.error("Phantom wallet not detected after waiting");
      alert("Phantom wallet is not installed or not loaded. Please install it from https://phantom.app/ and refresh the page.");
      return "";
    }

    console.log("Phantom wallet detected successfully");
    console.log("window.solana:", window.solana);

    console.log("Calling solana.connect()...");
    const response = await window.solana!.connect();
    console.log("Wallet connected successfully!");
    console.log("Public key:", response.publicKey.toString());

    return response.publicKey.toString();
  } catch (err: any) {
    console.error("Error connecting to wallet:", err);
    console.error("Error details:", JSON.stringify(err, null, 2));

    if (err.code === 4001) {
      alert("Connection request was rejected. Please approve the connection in Phantom wallet.");
    } else if (err.message?.includes("User rejected")) {
      alert("Connection was rejected. Please try again and approve the connection.");
    } else {
      alert("Failed to connect to Phantom wallet: " + (err.message || "Unknown error"));
    }
    return "";
  }
};

export const getBalance = async () => {
  try {
    if (!window.solana || !window.solana.publicKey) {
      return { balance: "", winBalance: "", vaultBalance: "" };
    }

    const provider = getProvider();
    //@ts-ignore
    const program = new Program(idl, programID, provider);

    if (!provider.publicKey) {
      return { balance: "", winBalance: "", vaultBalance: "" };
    }

    let vaultBalance = await provider.connection
      .getBalance(new PublicKey("DNifDbg6Mj2NrFWP31cUDTHt5mdqBAz7EHMwmY8ZAs9j"))
      .then(function (data) {
        return lamportsToSol(data).toFixed(2);
      })
      .catch(function (error) {
        console.error("Error fetching vault balance:", error);
        return "";
      });

    let balance = await provider.connection
      .getBalance(provider.publicKey)
      .then(function (data) {
        console.log("Wallet balance: " + lamportsToSol(data).toFixed(2));
        return lamportsToSol(data).toFixed(2);
      })
      .catch(function (error) {
        console.error("Error fetching wallet balance:", error);
        return "";
      });

    const [userVault, ubump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("uvault"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
    let winBalance = await provider.connection
      .getBalance(userVault)
      .then(function (data) {
        console.log("Winning balance: " + lamportsToSol(data).toFixed(2));
        return lamportsToSol(data).toFixed(2);
      })
      .catch(function (error) {
        console.error("Error fetching winning balance:", error);
        return "";
      });

    return { balance, winBalance, vaultBalance };
  } catch (error) {
    console.error("Error in getBalance:", error);
    return { balance: "", winBalance: "", vaultBalance: "" };
  }
};
