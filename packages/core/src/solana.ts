import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export function createConnection(rpcUrl = 'https://api.mainnet-beta.solana.com') {
  return new Connection(rpcUrl, 'confirmed');
}

export async function getSolBalance(pubkeyBase58: string, connection: Connection): Promise<number> {
  const pubkey = new PublicKey(pubkeyBase58);
  const lamports = await connection.getBalance(pubkey);
  return lamports / LAMPORTS_PER_SOL;
}

export async function sendSol(
  fromSecretKey: Uint8Array,
  toPubkeyBase58: string,
  solAmount: number,
  connection: Connection
): Promise<string> {
  const from = Keypair.fromSecretKey(fromSecretKey);
  const to = new PublicKey(toPubkeyBase58);
  const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: from.publicKey, toPubkey: to, lamports: Math.round(solAmount * LAMPORTS_PER_SOL) }));
  const sig = await connection.sendTransaction(tx, [from]);
  return sig;
}