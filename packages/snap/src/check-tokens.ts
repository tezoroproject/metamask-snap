import { ManageStateOperation } from '@metamask/snaps-sdk';

import { THRESHOLD_MIN_USD } from './constants';
import getPriceOfAssetQuotedInUSD from './external/get-price-of-asset-quoted-in-usd';
import getActiveBackups from './get-active-backups';
import getTokenBalances from './get-token-balances';
import { accountsSchema, stateSchema } from './schemas';
import assertIsWithMessage from './utils/assert-is-with-message';

async function getAccounts() {
  const rawAccounts = await ethereum.request({ method: 'eth_accounts' });
  return accountsSchema.parse(rawAccounts);
}

async function getState() {
  return await snap.request({
    method: 'snap_manageState',
    params: {
      operation: ManageStateOperation.GetState,
      encrypted: true,
    },
  });
}

export default async function checkTokens() {
  const state = await getState();
  if (!state) {
    return {
      isStatePresent: false,
      isTokenPresent: false,
    };
  }
  const parsedState = stateSchema.safeParse(state);
  if (!parsedState.success) {
    return {
      isStatePresent: true,
      isTokenPresent: false,
    };
  }
  const { token } = parsedState.data;
  if (!token) {
    return {
      isStatePresent: true,
      isTokenPresent: true,
    };
  }
  try {
    const activeBackups = await getActiveBackups(token);
    const accounts = await getAccounts();

    let balancesByAccount: Partial<
      Record<string, Partial<Record<string, string>>>
    > = {};

    // ACCOUNT PROCESSING
    for (const account of accounts) {
      const tokenBalances = await getTokenBalances(account);

      // ACCOUNT TOKEN PROCESSING
      for (const {
        decimal,
        balance,
        label,
        address,
      } of tokenBalances.values()) {
        const balanceInDecimal = parseFloat(balance.toString()) / 10 ** decimal;
        const priceOfAssetQuotedInUSD = await getPriceOfAssetQuotedInUSD(label);
        if (balanceInDecimal > 0) {
          // No need to check zero balances.
          const balanceInUSD = balanceInDecimal * priceOfAssetQuotedInUSD;
          const totalTokenBackupsAmount = activeBackups
            .filter(
              (backup) =>
                backup.tokenAddress?.toLowerCase() === address.toLowerCase(),
            )
            .reduce<number>((acc, backup) => {
              if (backup.amount !== undefined) {
                return acc + parseFloat(backup.amount);
              }
              return acc;
            }, 0);
          const totalTokenBackupsAmountInUSD =
            totalTokenBackupsAmount * priceOfAssetQuotedInUSD;
          const notBackedUpAmountInUSD =
            balanceInUSD - totalTokenBackupsAmountInUSD;
          if (notBackedUpAmountInUSD > THRESHOLD_MIN_USD) {
            balancesByAccount = {
              ...balancesByAccount,
              [account]: {
                ...balancesByAccount[account],
                [label]: balanceInUSD.toFixed(2),
              },
            };
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
