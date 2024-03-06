import { ManageStateOperation } from '@metamask/snaps-sdk';

import ERC20 from './abi/ERC20';
import { THRESHOLD_MIN_USD, network } from './constants';
import getPriceOfAssetQuotedInUSD from './external/get-price-of-asset-quoted-in-usd';
import getActiveBackups from './get-active-backups';
import publicClient from './public-client';
import { accountsSchema, stateSchema } from './schemas';
import { sepoliaTokens, ethereumTokens } from './tokens-list';
import assertIsWithMessage from './utils/assert-is-with-message';

const tokens = network === 'mainnet' ? ethereumTokens : sepoliaTokens;

export default async function checkTokens() {
  const state = await snap.request({
    method: 'snap_manageState',
    params: {
      operation: ManageStateOperation.GetState,
      encrypted: true,
    },
  });
  if (state) {
    const parsedState = stateSchema.safeParse(state);
    if (parsedState.success) {
      const { token } = parsedState.data;
      if (token) {
        try {
          const activeBackups = await getActiveBackups(token);
          const rawAccounts = await ethereum.request({
            method: 'eth_accounts',
            params: [],
          });
          const accounts = accountsSchema.parse(rawAccounts);

          let balancesByAccount: Partial<
            Record<string, Partial<Record<string, string>>>
          > = {};

          for (const account of accounts) {
            const balances = await publicClient.multicall({
              allowFailure: false,
              contracts: tokens.map(
                (asset) =>
                  ({
                    address: asset.address,
                    abi: ERC20,
                    functionName: 'balanceOf',
                    args: [account],
                  } as const),
              ),
            });

            const decimals = await publicClient.multicall({
              allowFailure: false,
              contracts: tokens.map((asset) => ({
                address: asset.address,
                abi: ERC20,
                functionName: 'decimals',
              })),
            });

            for (const [index, balance] of balances.entries()) {
              const tokenData = tokens[index];
              const decimal = decimals[index];
              if (tokenData !== undefined && decimal !== undefined) {
                const balanceInDecimal =
                  parseFloat(balance.toString()) /
                  10 ** parseInt(decimal.toString(), 10);
                const priceOfAssetQuotedInUSD =
                  await getPriceOfAssetQuotedInUSD(tokenData.label);
                if (balanceInDecimal > 0) {
                  const balanceInUSD =
                    balanceInDecimal * priceOfAssetQuotedInUSD;
                  const totalTokenBackupsAmount = activeBackups
                    .filter(
                      // filter backups by token address
                      (backup) =>
                        backup.tokenAddress?.toLowerCase() ===
                        tokenData.address.toLowerCase(),
                    )
                    .reduce<number>((acc, backup) => {
                      if (backup.amount !== undefined) {
                        return acc + parseFloat(backup.amount);
                      }
                      return acc;
                    }, 0);
                  const notBackedUpAmount =
                    balanceInUSD - totalTokenBackupsAmount;
                  if (notBackedUpAmount > THRESHOLD_MIN_USD) {
                    balancesByAccount = {
                      ...balancesByAccount,
                      [account]: {
                        ...balancesByAccount[account],
                        [tokenData.label]: balanceInUSD.toFixed(2),
                      },
                    };
                  }
                }
              }
            }
          }

          return {
            isStatePresent: true,
            isTokenPresent: true,
            data: balancesByAccount,
          };
        } catch (error) {
          assertIsWithMessage(error);
          return {
            isStatePresent: true,
            isTokenPresent: true,
            error: error.message,
          };
        }
      }
      return {
        isStatePresent: true,
        isTokenPresent: true,
      };
    }
    return {
      isStatePresent: true,
      isTokenPresent: false,
    };
  }
  return {
    isStatePresent: false,
    isTokenPresent: false,
  };
}
