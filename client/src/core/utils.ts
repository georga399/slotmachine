import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const lamportsToSol = (lamports: number) => {
  return (lamports / LAMPORTS_PER_SOL).toFixed(2);
};

export const formatAddress = (address: string) => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};
