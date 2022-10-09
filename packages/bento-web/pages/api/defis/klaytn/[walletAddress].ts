import { getTokenBalancesFromCovalent } from '@bento/core';
import { NextApiRequest, NextApiResponse } from 'next';

import { withCORS } from '@/utils/middlewares/withCORS';

import {
  KLAYSWAP_LEVERAGE_POOLS,
  KLAYSWAP_LP_POOLS,
  KOKONUTSWAP_LP_POOLS,
  klaytnChain,
} from '@/defi/constants';
import { KlaySwap } from '@/defi/klayswap';
import { KokonutSwap } from '@/defi/kokonutswap';
import { DeFiStaking } from '@/defi/types/staking';

const asyncFlatMap = async <T extends any, U extends any>(
  array: T[],
  callback: (value: T, index: number, array: T[]) => Promise<[] | U | U[]>,
): Promise<U[]> => {
  const result = await Promise.all(array.map(callback));
  return result.flat() as U[];
};

interface APIRequest extends NextApiRequest {
  query: {
    walletAddress?: string;
  };
}

const parseWallets = (mixedQuery: string) => {
  const query = mixedQuery.toLowerCase();
  if (query.indexOf(',') === -1) {
    return [query];
  }
  return query.split(',');
};

const isSameAddress = (a: string, b: string): boolean => {
  try {
    return a.toLowerCase() === b.toLowerCase();
  } catch (err) {
    console.error(err, { a, b });
    return false;
  }
};

const handler = async (req: APIRequest, res: NextApiResponse) => {
  const wallets = parseWallets(req.query.walletAddress ?? '');

  // TODO: Enumerate for all wallets
  const walletAddress = wallets[0];
  const [tokenBalances, dynamicLeveragePools] = await Promise.all([
    getTokenBalancesFromCovalent({
      chainId: klaytnChain.chainId,
      walletAddress,
    }),
    KlaySwap.getLeveragePoolList().catch(() => undefined),
  ]);

  const stakings: DeFiStaking[] = await asyncFlatMap(
    tokenBalances,
    async (token) => {
      if (token.balance === null) {
        // Indexed at least once
        return [];
      }

      // KLAYswap LP
      const klayswapLPPool = KLAYSWAP_LP_POOLS.find((v) =>
        isSameAddress(v.exchange_address, token.contract_address),
      );
      if (!!klayswapLPPool) {
        return KlaySwap.getLPPoolBalance(
          walletAddress,
          token.balance,
          klayswapLPPool,
        );
      }

      // KLAYswap Leverage Pool (Single Staking)
      const klayswapLeveragePool = KLAYSWAP_LEVERAGE_POOLS.find((v) =>
        isSameAddress(v.address, token.contract_address),
      );
      if (!!klayswapLeveragePool) {
        return KlaySwap.getSinglePoolBalance(
          walletAddress,
          token.balance,
          klayswapLeveragePool,
          dynamicLeveragePools?.find(
            (v) => v.address === klayswapLeveragePool.address,
          ),
        );
      }

      // KLAYswap Governance
      if (isSameAddress(token.contract_address, KlaySwap.VOTING_KSP_ADDRESS)) {
        return KlaySwap.getGovernanceStake(walletAddress, token.balance);
      }

      // Kokonutswap LP
      const kokonutswapLPPool = KOKONUTSWAP_LP_POOLS.find((v) =>
        isSameAddress(v.lpTokenAddress, token.contract_address),
      );
      if (!!kokonutswapLPPool) {
        return KokonutSwap.getLPPoolBalance(
          walletAddress,
          token.balance,
          kokonutswapLPPool,
          KOKONUTSWAP_LP_POOLS,
        );
      }

      // Kokonutswap Governance
      if (
        isSameAddress(token.contract_address, KokonutSwap.STAKED_KOKOS_ADDRESS)
      ) {
        return KokonutSwap.getGovernanceStake(walletAddress, token.balance);
      }

      return [];
    },
  );

  res.status(200).json(stakings);
};

export default withCORS(handler);
