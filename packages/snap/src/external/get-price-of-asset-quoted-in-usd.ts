import { z } from 'zod';

import { STABLE_COINS } from '../constants';

const dataSchema = z.object({
  price: z.string(),
});

export default async function getPriceOfAssetQuotedInUSD(assetName: string) {
  if (
    STABLE_COINS.some((stableCoin) => assetName.toUpperCase() === stableCoin)
  ) {
    return 1;
  }
  if (assetName.startsWith('W')) {
    // Assume this is a wrapped token
    assetName = assetName.slice(1); // remove W
  }
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${assetName.toUpperCase()}USDT`,
    );
    const json = await response.json();
    const parsedData = dataSchema.parse(json);

    return parseFloat(parsedData.price);
  } catch {
    return 0;
  }
}
