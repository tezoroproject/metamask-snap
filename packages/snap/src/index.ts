import { rpcErrors } from '@metamask/rpc-errors';
import type { OnCronjobHandler } from '@metamask/snaps-sdk';
import {
  ManageStateOperation,
  heading,
  panel,
  text,
} from '@metamask/snaps-sdk';
import { isAddress, createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { z } from 'zod';

import ERC20 from './ERC20';
import Tezoro from './Tezoro';
import { sepoliaTokens, ethereumTokens } from './tokens-list';

const stateSchema = z.object({
  token: z.string().optional(),
});

export type State = z.infer<typeof stateSchema>;

type SaveToken = {
  method: 'saveToken';
  params: {
    token: string;
  };
};

type DeleteToken = {
  method: 'deleteToken';
};

type GetToken = {
  method: 'getToken';
};

type CheckTokens = {
  method: 'checkTokens';
};

type RequestAccounts = {
  method: 'requestAccounts';
};
type GetAccounts = {
  method: 'getAccounts';
};

type RequestType =
  | SaveToken
  | DeleteToken
  | GetToken
  | CheckTokens
  | RequestAccounts
  | GetAccounts;

type OnRpcRequestHandler = (args: { request: RequestType }) => Promise<unknown>;

type Network = 'mainnet' | 'sepolia';

const network = 'mainnet' as Network;

const API_URL =
  network === 'mainnet'
    ? 'https://tezoro.io/api'
    : 'https://dev-987354.tezoro.io/api';

const publicClient = createPublicClient({
  chain: network === 'mainnet' ? mainnet : sepolia,
  transport: http(),
});

const tokens = network === 'mainnet' ? ethereumTokens : sepoliaTokens;

const THRESHOLD_MIN_USD = 2000;

const evmAddress = z.string().refine(isAddress, (address) => ({
  message: `${address} is not a valid address`,
}));

const backupSchema = z.object({
  amount: z.string().optional(),
  id: z.string(),
  timestamp: z.number().int().nonnegative().catch(0),
  contractAddress: evmAddress,
  ownerAddress: evmAddress,
  userHash: z.string(),
  activeTransactionHash: z.string().optional(),
  beneficiaries: z
    .object({
      address: z.string().optional(),
      percent: z.number().optional(),
    })
    .array(),
  dateTriggerTimestamp: z.number().int().nonnegative().catch(0),
  restoreDateTimestamp: z.number().int().nonnegative(),
  metaId: z.string(),
  status: z.string().optional(),
  inactiveMonthPeriod: z.number().optional(),
  isLaunchByInactivePeriod: z.boolean().optional(),
  isLaunchedByInactivePeriod: z.boolean().optional(),
  executor: z.string().optional(),
  nonce: z
    .object({ value: z.number().optional(), date: z.number().optional() })
    .optional(),
});

const getBackups = async (token: string) => {
  const responseData = await fetch(`${API_URL}/user/backups`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const json: unknown = await responseData.json();
  const parsedBackupsData = backupSchema.array().parse(json);
  return parsedBackupsData;
};

const getPriceOfAssetQuotedInUSD = async (assetName: string) => {
  if (
    assetName === 'USDT' ||
    assetName === 'USDC' ||
    assetName === 'DAI' ||
    assetName === 'USDP' ||
    assetName === 'TUSD'
  ) {
    return 1;
  }
  if (assetName.startsWith('W')) {
    assetName = assetName.slice(1); // remove W
  }
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${assetName.toUpperCase()}USDT`,
    );
    const json = await response.json();
    const parsedData = z
      .object({
        price: z.string(),
      })
      .parse(json);

    return parseFloat(parsedData.price);
  } catch {
    return 0;
  }
};

function assertIsWithMessage(
  candidate: unknown,
): asserts candidate is { message: unknown } {
  if (typeof candidate !== 'object' || candidate === null) {
    throw new Error('Assertion failed: candidate is not an object');
  }
  if (!('message' in candidate)) {
    throw new Error(
      'Assertion failed: candidate does not have a message property',
    );
  }
}

const checkTokens = async () => {
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
          const backups = await getBackups(token);
          const backupsTokenAddresses = await publicClient.multicall({
            allowFailure: false,
            contracts: backups.map(
              (backup) =>
                ({
                  address: backup.contractAddress,
                  abi: Tezoro,
                  functionName: 'tokenAddress' as const,
                } as const),
            ),
          });
          const backupsState = await publicClient.multicall({
            allowFailure: false,
            contracts: backups.map(
              (backup) =>
                ({
                  address: backup.contractAddress,
                  abi: Tezoro,
                  functionName: 'state' as const,
                } as const),
            ),
          });

          const activeBackups = backups
            .map((backup, index) => {
              const backupState = backupsState[index];
              return {
                ...backup,
                tokenAddress: backupsTokenAddresses[index],
                isTerminalState: backupState !== undefined && backupState > 3,
              };
            })
            .filter((backup) => !backup.isTerminalState);

          const rawAccounts = await ethereum.request({
            method: 'eth_accounts',
            params: [],
          });
          const accounts = z.array(z.string()).parse(rawAccounts);

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
};

export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  switch (request.method) {
    case 'requestAccounts': {
      const data = await ethereum.request({
        method: 'eth_requestAccounts',
        params: [],
      });
      return z.array(z.string()).parse(data);
    }
    case 'getAccounts': {
      const data = await ethereum.request({
        method: 'eth_accounts',
        params: [],
      });
      return z.array(z.string()).parse(data);
    }
    case 'checkTokens': {
      const data = await checkTokens();
      return data;
    }
    case 'saveToken': {
      const result = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Would you like to connect your account?'),
            text('The action binds your Tezoro account to the snap.'),
          ]),
        },
      });
      if (result === true) {
        const { params } = request;

        await snap.request({
          method: 'snap_manageState',

          params: {
            operation: ManageStateOperation.UpdateState,
            newState: {
              token: params.token,
            },
            encrypted: true,
          },
        });
        return true;
      }
      return false;
    }

    case 'getToken': {
      const state = await snap.request({
        method: 'snap_manageState',
        params: {
          operation: ManageStateOperation.GetState,
          encrypted: true,
        },
      });

      if (state === null) {
        return null;
      }
      const parsedState = stateSchema.safeParse(state);
      if (!parsedState.success) {
        throw new Error(
          `State is invalid: ${parsedState.error.errors.join(', ')}`,
        );
      }
      return parsedState.data.token;
    }

    case 'deleteToken': {
      await snap.request({
        method: 'snap_manageState',

        params: {
          operation: ManageStateOperation.UpdateState,
          newState: {},
          encrypted: true,
        },
      });
      return true;
    }

    default:
      throw rpcErrors.methodNotFound({
        data: {
          // @ts-expect-error - We already handle all cases above.
          method: request.method,
        },
      });
  }
};

export const onCronjob: OnCronjobHandler = async ({ request }) => {
  switch (request.method) {
    case 'checkTokens':
      {
        const { data } = await checkTokens();
        if (data) {
          const tokensList = new Set<string>();
          Object.values(data).map(async (balances) => {
            if (balances) {
              Object.keys(balances).forEach((token) => {
                tokensList.add(token);
              });
            }
          });
          if (tokensList.size > 0) {
            [...tokensList].map(async (token) => {
              await snap.request({
                method: 'snap_notify',
                params: {
                  type: 'native',
                  message: `Protect ${token} from loss with on-chain backup & will`,
                },
              });
            });
          }
        }
      }
      break;
    default:
      throw rpcErrors.methodNotFound({
        data: {
          method: request.method,
        },
      });
  }
};
