import { rpcErrors } from '@metamask/rpc-errors';
import type { OnCronjobHandler } from '@metamask/snaps-sdk';
import {
  ManageStateOperation,
  heading,
  panel,
  text,
} from '@metamask/snaps-sdk';

import checkTokens from './check-tokens';
import { accountsSchema } from './schemas';
import type { OnRpcRequestHandler } from './types';

export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  switch (request.method) {
    case 'requestAccounts': {
      const data = await ethereum.request({
        method: 'eth_requestAccounts',
        params: [],
      });
      return accountsSchema.parse(data);
    }
    case 'getAccounts': {
      const data = await ethereum.request({
        method: 'eth_accounts',
        params: [],
      });
      return accountsSchema.parse(data);
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
    case 'checkTokens': {
      const { data, error } = await checkTokens();
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
      return {
        data,
        error,
      };
    }
    default:
      throw rpcErrors.methodNotFound({
        data: {
          method: request.method,
        },
      });
  }
};
