import { PublicKey } from "@solana/web3.js";
import { getProvider, getProgram } from "./conn";
import { lamportsToSol } from "./utils";

const TREASURY_PDA_SEED = "treasury";
const USER_VAULT_SEED = "uvault";

export const checkIfWalletConnected = async () => {
  try {
    const { solana } = window as any;

    if (solana) {
      if (solana.isPhantom) {
        const response = await solana.connect({ onlyIfTrusted: true });
        return response.publicKey.toString();
      }
    } else {
      console.log("Phantom wallet not found!");
    }
  } catch (error) {
    console.error(error);
  }
  return "";
};

export const connectWallet = async () => {
  try {
    const { solana } = window as any;

    if (solana) {
      const response = await solana.connect();
      return response.publicKey.toString();
    }
  } catch (error) {
    console.error(error);
  }
  return "";
};

export const getBalance = async () => {
  try {
    const provider = getProvider();
    const program = getProgram();
    const connection = provider.connection;

    const balance = await connection.getBalance(provider.wallet.publicKey);

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(TREASURY_PDA_SEED)],
      program.programId
    );

    const [userVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_VAULT_SEED), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    let vaultBalance = 0;
    let winBalance = 0;

    try {
      vaultBalance = await connection.getBalance(vaultPda);
    } catch (e) {
      console.log("Vault not initialized yet");
    }

    try {
      winBalance = await connection.getBalance(userVaultPda);
    } catch (e) {
      console.log("User vault not created yet");
    }

    return {
      balance: lamportsToSol(balance),
      vaultBalance: lamportsToSol(vaultBalance),
      winBalance: lamportsToSol(winBalance),
    };
  } catch (error) {
    console.error(error);
    return { balance: "0", vaultBalance: "0", winBalance: "0" };
  }
};
