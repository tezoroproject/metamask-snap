import { ethereumTokens, sepoliaTokens } from './tokens-list';

type Network = 'mainnet' | 'sepolia';

export const network = 'mainnet' as Network;

export const API_URL =
  network === 'mainnet'
    ? 'https://tezoro.io/api'
    : 'https://dev-987354.tezoro.io/api';

export const THRESHOLD_MIN_USD = 2000;

export const STABLE_COINS = ['USDT', 'USDC', 'DAI', 'USDP', 'TUSD'];

export const tokens = network === 'mainnet' ? ethereumTokens : sepoliaTokens;
