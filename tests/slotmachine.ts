import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Slotmachine } from "../target/types/slotmachine";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("slotmachine", () => {
  // Configure the client to use devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.slotmachine as Program<Slotmachine>;
  const wallet = provider.wallet;

  it("Initializes the vault", async () => {
    const [vault, bump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId
    );

    try {
      const tx = await program.methods
        .init()
        .accounts({
          signer: wallet.publicKey,
        })
        .rpc();

      console.log("Vault initialized! Transaction signature:", tx);
      console.log("Vault address:", vault.toString());

      // Verify vault was created
      const vaultAccount = await program.account.vault.fetch(vault);
      console.log("Vault spin count:", vaultAccount.spin.toString());
      console.log("Vault seed:", vaultAccount.seed.toString());
    } catch (error) {
      // If vault already exists, that's okay
      if (error.message && error.message.includes("already in use")) {
        console.log("Vault already initialized, continuing...");
      } else {
        throw error;
      }
    }
  });

  it("Creates user vault", async () => {
    const [userVault, bump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("uvault"), wallet.publicKey.toBuffer()],
      program.programId
    );

    try {
      const tx = await program.methods
        .createUserVault()
        .accounts({
          signer: wallet.publicKey,
        })
        .rpc();

      console.log("User vault created! Transaction signature:", tx);
      console.log("User vault address:", userVault.toString());
    } catch (error) {
      // If user vault already exists, that's okay
      if (error.message && error.message.includes("already in use")) {
        console.log("User vault already exists, continuing...");
      } else {
        throw error;
      }
    }
  });

  it("Plays a spin", async () => {
    const [vault, vaultBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId
    );

    const [userVault, userVaultBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("uvault"), wallet.publicKey.toBuffer()],
      program.programId
    );

    // Get balances before spin
    const walletBalanceBefore = await provider.connection.getBalance(
      wallet.publicKey
    );
    const userVaultBalanceBefore = await provider.connection.getBalance(
      userVault
    );
    const vaultBalanceBefore = await provider.connection.getBalance(vault);

    console.log("\n=== Before Spin ===");
    console.log(
      "Wallet balance:",
      walletBalanceBefore / LAMPORTS_PER_SOL,
      "SOL"
    );
    console.log(
      "User vault balance:",
      userVaultBalanceBefore / LAMPORTS_PER_SOL,
      "SOL"
    );
    console.log(
      "Vault balance:",
      vaultBalanceBefore / LAMPORTS_PER_SOL,
      "SOL"
    );

    // Get vault state before
    const vaultAccountBefore = await program.account.vault.fetch(vault);
    console.log("Spin count before:", vaultAccountBefore.spin.toString());

    // Create user vault if it doesn't exist (as pre-instruction)
    let preInstructions = [];
    try {
      await program.account.userVault.fetch(userVault);
    } catch {
      // User vault doesn't exist, add create instruction
      preInstructions.push(
        await program.methods
          .createUserVault()
          .accounts({
            signer: wallet.publicKey,
          })
          .instruction()
      );
    }

    // Perform spin
    const tx = await program.methods
      .spin()
      .accounts({
        signer: wallet.publicKey,
      })
      .preInstructions(preInstructions)
      .rpc();

    console.log("\nSpin transaction signature:", tx);

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

    console.log("\n=== After Spin ===");
    console.log(
      "Wallet balance:",
      walletBalanceAfter / LAMPORTS_PER_SOL,
      "SOL"
    );
    console.log(
      "User vault balance:",
      userVaultBalanceAfter / LAMPORTS_PER_SOL,
      "SOL"
    );
    console.log(
      "Vault balance:",
      vaultBalanceAfter / LAMPORTS_PER_SOL,
      "SOL"
    );

    // Get vault state after
    const vaultAccountAfter = await program.account.vault.fetch(vault);
    console.log("Spin count after:", vaultAccountAfter.spin.toString());

    // Calculate winnings
    const winnings =
      (userVaultBalanceAfter - userVaultBalanceBefore) / LAMPORTS_PER_SOL;
    if (winnings > 0) {
      console.log("\n🎉 You won:", winnings, "SOL!");
    } else {
      console.log("\n😔 You lost this spin");
    }

    // Verify wallet lost 0.1 SOL (bet amount)
    const walletLoss = (walletBalanceBefore - walletBalanceAfter) / LAMPORTS_PER_SOL;
    console.log("Bet amount (wallet loss):", walletLoss, "SOL");
  });

  it("Claims winnings", async () => {
    const [userVault, userVaultBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("uvault"), wallet.publicKey.toBuffer()],
      program.programId
    );

    // Get balances before claim
    const walletBalanceBefore = await provider.connection.getBalance(
      wallet.publicKey
    );
    const userVaultBalanceBefore = await provider.connection.getBalance(
      userVault
    );

    console.log("\n=== Before Claim ===");
    console.log(
      "Wallet balance:",
      walletBalanceBefore / LAMPORTS_PER_SOL,
      "SOL"
    );
    console.log(
      "User vault balance:",
      userVaultBalanceBefore / LAMPORTS_PER_SOL,
      "SOL"
    );

    if (userVaultBalanceBefore <= 967440) {
      console.log("No winnings to claim (only rent-exempt balance)");
      return;
    }

    const claimableAmount =
      (userVaultBalanceBefore - 967440) / LAMPORTS_PER_SOL;
    console.log("Claimable amount:", claimableAmount, "SOL");

    // Claim winnings
    const tx = await program.methods
      .claimWinnings()
      .accounts({
        signer: wallet.publicKey,
      })
      .rpc();

    console.log("\nClaim transaction signature:", tx);

    // Wait for confirmation
    await provider.connection.confirmTransaction(tx, "confirmed");

    // Get balances after claim
    const walletBalanceAfter = await provider.connection.getBalance(
      wallet.publicKey
    );
    const userVaultBalanceAfter = await provider.connection.getBalance(
      userVault
    );

    console.log("\n=== After Claim ===");
    console.log(
      "Wallet balance:",
      walletBalanceAfter / LAMPORTS_PER_SOL,
      "SOL"
    );
    console.log(
      "User vault balance:",
      userVaultBalanceAfter / LAMPORTS_PER_SOL,
      "SOL"
    );

    const claimedAmount =
      (walletBalanceAfter - walletBalanceBefore) / LAMPORTS_PER_SOL;
    console.log("Claimed amount:", claimedAmount, "SOL");
  });

  it("Withdraws from vault", async () => {
    const [vault, vaultBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId
    );

    const balanceBefore = await provider.connection.getBalance(vault);
    const walletBalanceBefore = await provider.connection.getBalance(
      wallet.publicKey
    );

    console.log("\n=== Before Withdraw from Vault ===");
    console.log(
      "Vault balance:",
      balanceBefore / LAMPORTS_PER_SOL,
      "SOL"
    );
    console.log(
      "Wallet balance:",
      walletBalanceBefore / LAMPORTS_PER_SOL,
      "SOL"
    );

    const amount = 0.1; // SOL
    const lamports = amount * LAMPORTS_PER_SOL;
    const available = Math.max(0, (balanceBefore - 967440) / LAMPORTS_PER_SOL);

    if (amount > available) {
      console.log(`❌ Недостаточно средств. Доступно: ${available} SOL`);
      return;
    }

    console.log(`\nВыполнение withdrawFromVault на ${amount} SOL...`);

    const tx = await program.methods
      .withdrawFromVault(new anchor.BN(lamports))
      .accounts({
        vault: vault,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Withdrawn! Transaction signature:", tx);

    const balanceAfter = await provider.connection.getBalance(vault);
    const walletBalanceAfter = await provider.connection.getBalance(
      wallet.publicKey
    );

    console.log("\n=== After Withdraw from Vault ===");
    console.log(
      "Vault balance:",
      balanceAfter / LAMPORTS_PER_SOL,
      "SOL"
    );
    console.log(
      "Wallet balance:",
      walletBalanceAfter / LAMPORTS_PER_SOL,
      "SOL"
    );

    const withdrawnAmount =
      (walletBalanceAfter - walletBalanceBefore) / LAMPORTS_PER_SOL;
    console.log("Withdrawn amount:", withdrawnAmount, "SOL");
  });
});
