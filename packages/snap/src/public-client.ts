import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';

import { network } from './constants';

const publicClient = createPublicClient({
  chain: network === 'mainnet' ? mainnet : sepolia,
  transport: http(),
});

export default publicClient;
