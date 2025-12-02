import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../idl.json";

// Program ID from Anchor.toml - same as in scripts
const programId = new PublicKey("HpKZfyCptLBsFKtxFQiyWHNCpBmpWKERvZXY8YrSnLD4");

// Connect to devnet - same as in scripts
const network = "https://api.devnet.solana.com";

export const getProvider = () => {
  if (!(window as any).solana) {
    throw new Error("Phantom wallet not found! Please install Phantom wallet extension.");
  }

  // Create connection with 'confirmed' commitment - same as scripts
  const connection = new Connection(network, "confirmed");
  const wallet = (window as any).solana;

  // Create provider with same settings as scripts
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  return provider;
};

export const getProgram = () => {
  const provider = getProvider();
  return new Program(idl as Idl, programId, provider);
};

// Export programId for use in other modules
export { programId };
