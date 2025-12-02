import { PublicKey } from "@solana/web3.js";
import { getProvider } from "./conn";
import { lamportsToSol } from "./utils";
import idl from "../slots.json";
import { Program } from "@project-serum/anchor";

const programID = new PublicKey(idl.metadata.address);

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
  const { solana } = window;
  return new Promise(async (resolve, reject) => {
    try {
      if (solana && solana.isPhantom) {
        const response = await solana.connect();
        console.log("Wallet connected successfully:", response.publicKey.toString());
        resolve(response.publicKey.toString());
      } else {
        alert("Please install Phantom wallet from https://phantom.app/");
        console.error("Phantom wallet not detected");
        resolve("");
      }
    } catch (err) {
      console.error("Error connecting to wallet:", err);
      alert("Failed to connect to Phantom wallet. Please try again.");
      resolve("");
    }
  });
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
