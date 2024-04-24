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

type CheckTokens = {
  method: 'checkTokens';
};

type RequestAccounts = {
  method: 'requestAccounts';
};
type GetAccounts = {
  method: 'getAccounts';
};

type CheckIsTokenPresents = {
  method: 'checkIsTokenPresents';
};

type RequestType =
  | SaveToken
  | DeleteToken
  | CheckTokens
  | RequestAccounts
  | GetAccounts
  | CheckIsTokenPresents;

export type OnRpcRequestHandler = (args: {
  request: RequestType;
  origin: string;
}) => Promise<unknown>;
