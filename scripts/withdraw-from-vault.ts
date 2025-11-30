import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Slotmachine } from "../target/types/slotmachine";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

async function main() {
  // Get amount from command line arguments
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.log("💰 Withdraw from Vault Script");
    console.log("============================");
    console.log("Usage: npm run withdraw <amount_in_SOL>");
    console.log("Example: npm run withdraw 0.5");
    console.log("");
    console.log("This script withdraws funds from the treasury vault to your wallet.");
    console.log("Note: The vault must keep a rent-exempt minimum balance.");
    process.exit(1);
  }

  const amountSOL = parseFloat(args[0]);
  if (isNaN(amountSOL) || amountSOL <= 0) {
    console.error("❌ Error: Invalid amount. Must be a positive number.");
    process.exit(1);
  }

  const amountLamports = Math.floor(amountSOL * LAMPORTS_PER_SOL);

  console.log("💰 Withdraw from Vault Script");
  console.log("============================");
  console.log(`Withdrawing: ${amountSOL.toFixed(6)} SOL (${amountLamports} lamports)`);
  console.log();

  // Configure the client to use devnet
  const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
  const localWallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, localWallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  const program = anchor.workspace.slotmachine as Program<Slotmachine>;
  const wallet = provider.wallet;

  console.log(`Using wallet: ${wallet.publicKey.toString()}`);
  console.log(`Program ID: ${program.programId.toString()}`);
  console.log();

  // Calculate vault PDA
  const [vault] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  );

  console.log(`Vault address: ${vault.toString()}`);
  console.log();

  try {
    // Get balances before withdrawal
    const walletBalanceBefore = await provider.connection.getBalance(
      wallet.publicKey
    );
    const vaultBalanceBefore = await provider.connection.getBalance(vault);

    console.log("=== Before Withdrawal ===");
    console.log(`Wallet balance: ${(walletBalanceBefore / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`Vault balance: ${(vaultBalanceBefore / LAMPORTS_PER_SOL).toFixed(6)} SOL`);

    // Check if vault is initialized
    try {
      await program.account.vault.fetch(vault);
    } catch {
      console.log("❌ Vault not initialized!");
      return;
    }

    // Check available balance (excluding rent-exempt minimum)
    const RENT_EXEMPT = 967440; // lamports
    const availableForWithdrawal = Math.max(0, vaultBalanceBefore - RENT_EXEMPT);
    const availableSOL = availableForWithdrawal / LAMPORTS_PER_SOL;

    console.log(`Available for withdrawal: ${availableSOL.toFixed(6)} SOL (keeps ${(RENT_EXEMPT / LAMPORTS_PER_SOL).toFixed(6)} SOL rent-exempt)`);

    if (amountLamports > availableForWithdrawal) {
      console.log(`❌ Error: Insufficient funds. Maximum withdrawal: ${availableSOL.toFixed(6)} SOL`);
      return;
    }

    console.log();
    console.log("🏦 Withdrawing from vault...");

    // Execute withdrawal
    const tx = await program.methods
      .withdrawFromVault(new anchor.BN(amountLamports))
      .accounts({
        authority: wallet.publicKey,
      })
      .rpc();

    console.log(`✅ Withdrawal transaction: ${tx}`);

    // Wait for confirmation
    await provider.connection.confirmTransaction(tx, "confirmed");

    // Get balances after withdrawal
    const walletBalanceAfter = await provider.connection.getBalance(
      wallet.publicKey
    );
    const vaultBalanceAfter = await provider.connection.getBalance(vault);

    console.log();
    console.log("=== After Withdrawal ===");
    console.log(`Wallet balance: ${(walletBalanceAfter / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`Vault balance: ${(vaultBalanceAfter / LAMPORTS_PER_SOL).toFixed(6)} SOL`);

    // Calculate actual withdrawn amount
    const withdrawnAmount = (walletBalanceAfter - walletBalanceBefore) / LAMPORTS_PER_SOL;

    console.log();
    console.log("📊 Results:");
    console.log(`✅ Successfully withdrawn: ${withdrawnAmount.toFixed(6)} SOL`);

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
