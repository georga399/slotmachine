import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Slotmachine } from "../target/types/slotmachine";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

async function main() {
  console.log("💰 Claim Winnings Script");
  console.log("========================");

  // Configure the client to use devnet
  const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
  const localWallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, localWallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  const program = anchor.workspace.slotmachine as Program<Slotmachine>;
  const wallet = provider.wallet;

  console.log(`Using wallet: ${wallet.publicKey.toString()}`);
  console.log();

  // Calculate user vault PDA
  const [userVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("uvault"), wallet.publicKey.toBuffer()],
    program.programId
  );

  console.log(`User Vault: ${userVault.toString()}`);
  console.log();

  try {
    // Get balances before claim
    const walletBalanceBefore = await provider.connection.getBalance(
      wallet.publicKey
    );

    let userVaultBalanceBefore = 0;
    try {
      userVaultBalanceBefore = await provider.connection.getBalance(userVault);
    } catch {
      console.log("❌ User vault doesn't exist or has no balance!");
      return;
    }

    console.log("=== Before Claim ===");
    console.log(`Wallet balance: ${(walletBalanceBefore / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`User vault balance: ${(userVaultBalanceBefore / LAMPORTS_PER_SOL).toFixed(6)} SOL`);

    // Check if there are winnings to claim
    const RENT_EXEMPT = 967440; // lamports
    const claimable = userVaultBalanceBefore - RENT_EXEMPT;

    if (claimable <= 0) {
      console.log();
      console.log("❌ No winnings to claim! Your vault only contains the rent-exempt minimum.");
      return;
    }

    const claimableSOL = claimable / LAMPORTS_PER_SOL;
    console.log(`Claimable amount: ${claimableSOL.toFixed(6)} SOL`);
    console.log();

    console.log("💰 Claiming winnings...");

    // Execute claim
    const tx = await program.methods
      .claimWinnings()
      .accounts({
        signer: wallet.publicKey,
      })
      .rpc();

    console.log(`✅ Claim transaction: ${tx}`);

    // Wait for confirmation
    await provider.connection.confirmTransaction(tx, "confirmed");

    // Get balances after claim
    const walletBalanceAfter = await provider.connection.getBalance(
      wallet.publicKey
    );
    const userVaultBalanceAfter = await provider.connection.getBalance(
      userVault
    );

    console.log();
    console.log("=== After Claim ===");
    console.log(`Wallet balance: ${(walletBalanceAfter / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`User vault balance: ${(userVaultBalanceAfter / LAMPORTS_PER_SOL).toFixed(6)} SOL`);

    // Calculate claimed amount
    const claimedAmount = (walletBalanceAfter - walletBalanceBefore) / LAMPORTS_PER_SOL;

    console.log();
    console.log("📊 Results:");
    console.log(`✅ Successfully claimed: ${claimedAmount.toFixed(6)} SOL`);

    console.log();
    console.log("🔗 Transaction link:");
    console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
