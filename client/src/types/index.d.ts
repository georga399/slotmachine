export {};

declare global {
  interface Window {
    solana?: PhantomProvider;
    Buffer: typeof Buffer;
  }

  interface PhantomProvider {
    isPhantom?: boolean;
    publicKey?: { toString(): string };
    connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
    disconnect(): Promise<void>;
    signTransaction(transaction: any): Promise<any>;
    signAllTransactions(transactions: any[]): Promise<any[]>;
    signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
    on(event: string, callback: (args: any) => void): void;
    request(args: { method: string; params?: any }): Promise<any>;
  }
}