import { Bech32Address } from '@bento/core/lib/bech32';
import {
  CosmosHubChain,
  CosmosSDKBasedChain,
  OsmosisChain,
} from '@bento/core/lib/chains';
import { pricesFromCoinGecko } from '@bento/core/lib/pricings/CoinGecko';
import { CosmosSDKBasedChains } from '@bento/core/lib/types';
import { safePromiseAll } from '@bento/core/lib/utils';
import type { NextApiRequest, NextApiResponse } from 'next';

export type WalletBalance = {
  walletAddress: string;

  symbol: string;
  name: string;
  logo: string;

  balance: number;
  delegations: number;
  price: number;
};

interface APIRequest extends NextApiRequest {
  query: {
    network?: CosmosSDKBasedChains;
    walletAddress?: string;
  };
}

const chains: Record<CosmosSDKBasedChains, CosmosSDKBasedChain> = {
  'cosmos-hub': new CosmosHubChain(),
  osmosis: new OsmosisChain(),
};

const parseWallets = (mixedQuery: string) => {
  const query = mixedQuery.toLowerCase();
  if (query.indexOf(',') === -1) {
    return [query];
  }
  return query.split(',');
};

export default async (req: APIRequest, res: NextApiResponse) => {
  const wallets = parseWallets(req.query.walletAddress ?? '');
  const network = (
    req.query.network ?? ''
  ).toLowerCase() as CosmosSDKBasedChains;

  const result = await safePromiseAll(
    wallets.map(async (walletAddress) => {
      const bech32Address = Bech32Address.fromBech32(walletAddress);

      if (['cosmos-hub', 'osmosis'].includes(network)) {
        const chain = chains[network];
        const chainBech32Address = bech32Address.toBech32(
          chain.bech32Config.prefix,
        );
        const [balance, delegations] = await safePromiseAll([
          chain.getBalance(chainBech32Address).catch(() => 0),
          chain.getDelegations(chainBech32Address).catch(() => 0),
        ]);

        return {
          walletAddress: chainBech32Address,
          symbol: chain.currency.symbol,
          name: chain.currency.name,
          logo: chain.currency.logo,
          coinGeckoId: chain.currency.coinGeckoId,
          balance,
          delegations,
          price: undefined,
        };
      }
    }),
  );

  const coinGeckoIds = result
    .flatMap((x) => (!!x.coinGeckoId ? x.coinGeckoId : []))
    .filter((x, i, a) => a.indexOf(x) === i);

  const [coinGeckoPricesById] = await safePromiseAll([
    pricesFromCoinGecko(coinGeckoIds).catch(() => ({})),
  ]);

  result.forEach((token) => {
    if (typeof token.price === 'undefined') {
      if (!!token.coinGeckoId) {
        token.price = coinGeckoPricesById[token.coinGeckoId];
      } else {
        token.price = 0;
      }
    }
  });
  res.status(200).json(result);
};