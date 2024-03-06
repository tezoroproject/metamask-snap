import type { z } from 'zod';

import type { stateSchema } from './schemas';

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

export type OnRpcRequestHandler = (args: {
  request: RequestType;
}) => Promise<unknown>;
