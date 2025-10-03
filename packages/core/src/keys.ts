import { generateMnemonic as scureGenerateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export type KeypairInfo = {
  publicKey: string; // base58
  secretKey: Uint8Array;
};

export async function generateMnemonic(): Promise<string> {
  // 24-word mnemonic (256 bits entropy) using @scure/bip39 english wordlist
  return scureGenerateMnemonic(wordlist, 256);
}

export async function mnemonicToSeedBytes(mnemonic: string): Promise<Uint8Array> {
  // @scure/bip39 provides synchronous seed derivation returning Uint8Array
  const seed = mnemonicToSeedSync(mnemonic);
  return seed;
}

// Note: For the browser demo, we derive the keypair from the first 32 bytes of the BIP39 seed.
// This is deterministic but not a full SLIP-0010 HD derivation. We'll upgrade to hardened path derivation later.
export function deriveSolanaKeypair(seed: Uint8Array, account = 0): KeypairInfo {
  const seed32 = seed.slice(0, 32);
  const kp = nacl.sign.keyPair.fromSeed(seed32);
  return {
    publicKey: bs58.encode(kp.publicKey),
    secretKey: kp.secretKey,
  };
}