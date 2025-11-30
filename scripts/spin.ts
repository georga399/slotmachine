import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Slotmachine } from "../target/types/slotmachine";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

async function main() {
  console.log("🎰 Slot Machine Spin Script");
  console.log("==========================");

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

  // Calculate PDA addresses
  const [vault] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  );

  const [userVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("uvault"), wallet.publicKey.toBuffer()],
    program.programId
  );

  console.log("Addresses:");
  console.log(`Vault: ${vault.toString()}`);
  console.log(`User Vault: ${userVault.toString()}`);
  console.log();

  try {
    // Get balances before spin
    const walletBalanceBefore = await provider.connection.getBalance(
      wallet.publicKey
    );
    const vaultBalanceBefore = await provider.connection.getBalance(vault);

    // Check user vault balance
    let userVaultBalanceBefore = 0;
    try {
      userVaultBalanceBefore = await provider.connection.getBalance(userVault);
    } catch {
      console.log("User vault doesn't exist yet, will be created during spin");
    }

    console.log("=== Before Spin ===");
    console.log(`Wallet balance: ${(walletBalanceBefore / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`User vault balance: ${(userVaultBalanceBefore / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`Vault balance: ${(vaultBalanceBefore / LAMPORTS_PER_SOL).toFixed(6)} SOL`);

    // Check if vault is initialized
    try {
      const vaultAccount = await program.account.vault.fetch(vault);
      console.log(`Spin count: ${vaultAccount.spin.toString()}`);
    } catch {
      console.log("❌ Vault not initialized! Please run the init function first.");
      return;
    }

    console.log();
    console.log("🎯 Placing bet of 0.1 SOL...");

    // Prepare pre-instructions (create user vault if needed)
    let preInstructions = [];
    try {
      await program.account.userVault.fetch(userVault);
      console.log("✅ User vault exists");
    } catch {
      console.log("📝 Creating user vault...");
      preInstructions.push(
        await program.methods
          .createUserVault()
          .accounts({
            signer: wallet.publicKey,
          })
          .instruction()
      );
    }

    // Execute spin
    console.log("🎰 Spinning...");
    const tx = await program.methods
      .spin()
      .accounts({
        signer: wallet.publicKey,
      })
      .preInstructions(preInstructions)
      .rpc();

    console.log(`✅ Spin transaction: ${tx}`);

    // Wait for confirmation
    await provider.connection.confirmTransaction(tx, "confirmed");

    // Get balances after spin
    const walletBalanceAfter = await provider.connection.getBalance(
      wallet.publicKey
    );
    const userVaultBalanceAfter = await provider.connection.getBalance(
      userVault
    );
    const vaultBalanceAfter = await provider.connection.getBalance(vault);

    console.log();
    console.log("=== After Spin ===");
    console.log(`Wallet balance: ${(walletBalanceAfter / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`User vault balance: ${(userVaultBalanceAfter / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`Vault balance: ${(vaultBalanceAfter / LAMPORTS_PER_SOL).toFixed(6)} SOL`);

    // Calculate results
    const betAmount = (walletBalanceBefore - walletBalanceAfter) / LAMPORTS_PER_SOL;
    const winnings = (userVaultBalanceAfter - userVaultBalanceBefore) / LAMPORTS_PER_SOL;

    console.log();
    console.log("📊 Results:");
    console.log(`Bet amount: ${betAmount.toFixed(6)} SOL`);
    console.log(`Winnings: ${winnings.toFixed(6)} SOL`);

    if (winnings > 0) {
      console.log();
      console.log("🎉 Congratulations! You won!");
      console.log(`💰 You can claim your ${winnings.toFixed(6)} SOL winnings using the claim script.`);
    } else {
      console.log();
      console.log("😔 Better luck next time!");
    }

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
