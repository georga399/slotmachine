import * as buffer from "buffer";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider } from "@project-serum/anchor";

window.Buffer = buffer.Buffer;

const network = clusterApiUrl("devnet");
const opts = {
  preflightCommitment: "processed",
};

export const getProvider = () => {
  if (!window.solana) {
    throw new Error("Phantom wallet not found. Please install Phantom wallet.");
  }

  const connection = new Connection(network, opts.preflightCommitment as any);
  const provider = new AnchorProvider(
    connection,
    window.solana as any,
    opts.preflightCommitment as any
  );
  return provider;
};