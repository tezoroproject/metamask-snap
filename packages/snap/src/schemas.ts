import { isAddress } from 'viem';
import { z } from 'zod';

const evmAddress = z.string().refine(isAddress, (address) => ({
  message: `${address} is not a valid address`,
}));

export const backupSchema = z.object({
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

export const stateSchema = z.object({
  token: z.string(),
});

const jwtSchema = z
  .string()
  .max(8192, 'JWT must be at most 8192 bytes in length.');

export const authDataSchema = z.object({
  token: jwtSchema,
});

export const assetUSDPriceSchema = z.object({
  price: z.number(),
});

export const accountsSchema = z.array(z.string());
