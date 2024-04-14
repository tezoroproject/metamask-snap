import { API_URL } from './constants';
import { assetUSDPriceSchema } from './schemas';

export default async function getPriceOfAssetQuotedInUSD(assetAddress: string) {
  const responseData = await fetch(
    `${API_URL}/price/get_price_quoted_in_usd?tokenAddress=${assetAddress}`,
  );
  const json: unknown = await responseData.json();
  const { price } = assetUSDPriceSchema.parse(json);
  return price;
}
