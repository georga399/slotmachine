import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getProvider, getProgram } from "./conn";

const TREASURY_PDA_SEED = "treasury";
const USER_VAULT_SEED = "uvault";

export const initVault = async () => {
  try {
    const program = getProgram();
    const provider = getProvider();
    const connection = provider.connection;

    console.log("🏦 Initializing vault...");

    // Anchor auto-derives PDA accounts
    const tx = await program.methods
      .init()
      .accounts({
        signer: provider.wallet.publicKey,
      })
      .rpc();

    console.log(`✅ Vault initialized: ${tx}`);

    // Wait for confirmation
    await connection.confirmTransaction(tx, "confirmed");

    return true;
  } catch (error) {
    console.error("❌ Error initializing vault:", error);
    return false;
  }
};

export const initUserVault = async () => {
  try {
    const program = getProgram();
    const provider = getProvider();
    const connection = provider.connection;

    console.log("📝 Creating user vault...");

    // Anchor auto-derives PDA accounts
    const tx = await program.methods
      .createUserVault()
      .accounts({
        signer: provider.wallet.publicKey,
      })
      .rpc();

    console.log(`✅ User vault created: ${tx}`);

    // Wait for confirmation
    await connection.confirmTransaction(tx, "confirmed");

    return true;
  } catch (error) {
    console.error("❌ Error creating user vault:", error);
    return false;
  }
};

export const spin = async () => {
  try {
    const program = getProgram();
    const provider = getProvider();
    const connection = provider.connection;

    console.log("🎰 Starting spin...");
    console.log(`Wallet: ${provider.wallet.publicKey.toString()}`);

    // Calculate PDA addresses
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(TREASURY_PDA_SEED)],
      program.programId
    );

    const [userVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_VAULT_SEED), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    // Check if vault is initialized (like in scripts)
    try {
      const vaultAccount = await program.account.vault.fetch(vaultPda);
      console.log(`Current spin count: ${vaultAccount.spin.toString()}`);
    } catch {
      console.error("❌ Vault not initialized! Please initialize the vault first.");
      throw new Error("Vault not initialized");
    }

    // Check if user vault exists
    let preInstructions = [];
    try {
      await program.account.userVault.fetch(userVaultPda);
      console.log("✅ User vault exists");
    } catch {
      console.log("📝 Creating user vault...");
      preInstructions.push(
        await program.methods
          .createUserVault()
          .accounts({
            signer: provider.wallet.publicKey,
          })
          .instruction()
      );
    }

    console.log("🎯 Placing bet of 0.1 SOL...");
    console.log("🎰 Spinning...");

    // Execute spin - Anchor auto-derives PDA accounts (same as scripts)
    const tx = await program.methods
      .spin()
      .accounts({
        signer: provider.wallet.publicKey,
      })
      .preInstructions(preInstructions)
      .rpc();

    console.log(`✅ Spin transaction: ${tx}`);
    console.log(`🔗 https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    // Wait for confirmation
    await connection.confirmTransaction(tx, "confirmed");

    // Wait for logs to be available
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get transaction details
    const txInfo = await connection.getTransaction(tx, {
      commitment: "confirmed",
    });

    // Parse result from logs (same format as scripts)
    if (txInfo?.meta?.logMessages) {
      for (const log of txInfo.meta.logMessages) {
        if (log.includes("result:")) {
          const parts = log.split(" - ");
          const result = parts[parts.length - 1];
          console.log(`📊 Spin result: ${result}`);
          return result;
        }
      }
    }

    console.log("⚠️ Could not parse result from logs");
    return "0";
  } catch (error: any) {
    console.error("❌ Error spinning:", error?.message || error);
    throw error;
  }
};

export const collectWins = async () => {
  try {
    const program = getProgram();
    const provider = getProvider();
    const connection = provider.connection;

    const [userVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_VAULT_SEED), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    // Check if there are winnings to claim
    const RENT_EXEMPT = 967440; // lamports
    let userVaultBalance = 0;

    try {
      userVaultBalance = await connection.getBalance(userVaultPda);
    } catch {
      console.log("❌ User vault doesn't exist or has no balance!");
      return false;
    }

    const claimable = userVaultBalance - RENT_EXEMPT;
    if (claimable <= 0) {
      console.log("❌ No winnings to claim! Your vault only contains the rent-exempt minimum.");
      return false;
    }

    console.log(`💰 Claiming ${(claimable / 1e9).toFixed(6)} SOL...`);

    // Execute claim - Anchor auto-derives PDA accounts
    const tx = await program.methods
      .claimWinnings()
      .accounts({
        signer: provider.wallet.publicKey,
      })
      .rpc();

    console.log(`✅ Claim transaction: ${tx}`);

    // Wait for confirmation
    await connection.confirmTransaction(tx, "confirmed");

    console.log("✅ Winnings claimed successfully");
    return true;
  } catch (error) {
    console.error("❌ Error claiming winnings:", error);
    return false;
  }
};
