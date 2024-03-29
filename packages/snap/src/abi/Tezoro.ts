export default [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_creatorAddress',
        type: 'address',
      },
      { internalType: 'address', name: '_ownerAddress', type: 'address' },
      { internalType: 'address', name: '_executor', type: 'address' },
      {
        internalType: 'address',
        name: '_beneficiaryAddress0',
        type: 'address',
      },
      {
        internalType: 'uint32',
        name: '_beneficiaryShares0',
        type: 'uint32',
      },
      {
        internalType: 'address',
        name: '_beneficiaryAddress1',
        type: 'address',
      },
      {
        internalType: 'uint32',
        name: '_beneficiaryShares1',
        type: 'uint32',
      },
      {
        internalType: 'address',
        name: '_beneficiaryAddress2',
        type: 'address',
      },
      {
        internalType: 'uint32',
        name: '_beneficiaryShares2',
        type: 'uint32',
      },
      {
        internalType: 'address',
        name: '_beneficiaryAddress3',
        type: 'address',
      },
      { internalType: 'address', name: '_tokenAddress', type: 'address' },
      { internalType: 'uint256', name: '_delay', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  { inputs: [], name: 'AlreadyRevoked', type: 'error' },
  { inputs: [], name: 'CouldNotAbortRestoration', type: 'error' },
  { inputs: [], name: 'CouldNotRestoreYet', type: 'error' },
  { inputs: [], name: 'CouldNotRevokeYet', type: 'error' },
  { inputs: [], name: 'IllegalExecutorStateChange', type: 'error' },
  { inputs: [], name: 'IllegalStateChange', type: 'error' },
  { inputs: [], name: 'IncorrectShares', type: 'error' },
  { inputs: [], name: 'NotActive', type: 'error' },
  { inputs: [], name: 'NotOwnerOrCreator', type: 'error' },
  { inputs: [], name: 'ZeroAddress', type: 'error' },
  { inputs: [], name: 'ZeroDelay', type: 'error' },
  { inputs: [], name: 'ZeroTransferAmount', type: 'error' },
  { anonymous: false, inputs: [], name: 'Restored', type: 'event' },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint8',
        name: 'state',
        type: 'uint8',
      },
    ],
    name: 'StateChanged',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'uint8', name: '_state', type: 'uint8' }],
    name: 'changeState',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'delay',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'executor',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'initTimestamp',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'state',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'timestamp',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tokenAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'version',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
