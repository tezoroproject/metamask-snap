import ERC20 from './abi/ERC20';
import { tokens } from './constants';
import publicClient from './public-client';

export default async function getTokenBalances(account: string) {
  const balances = await publicClient.multicall({
    allowFailure: false,
    contracts: tokens.map(
      (token) =>
        ({
          address: token.address,
          abi: ERC20,
          functionName: 'balanceOf',
          args: [account],
        } as const),
    ),
  });

  const decimals = await publicClient.multicall({
    allowFailure: false,
    contracts: tokens.map(
      (token) =>
        ({
          address: token.address,
          abi: ERC20,
          functionName: 'decimals',
        } as const),
    ),
  });

  return tokens.map((token, index) => {
    const balance = balances[index];
    if (balance === undefined) {
      throw new TypeError('Unexpected undefined balance');
    }
    const decimal = decimals[index];
    if (decimal === undefined) {
      throw new TypeError('Unexpected undefined decimal');
    }
    return {
      ...token,
      balance,
      decimal,
    };
  });
}
