import { KlaytnChain, getTokenBalancesFromCovalent } from '@bento/core';
import { NextApiRequest, NextApiResponse } from 'next';

import { withCORS } from '@/utils/middlewares/withCORS';

import KLAYSWAP_LEVERAGE_POOLS from '@/defi/constants/klayswap-leverage-pools.json';
import KLAYSWAP_LP_POOLS from '@/defi/constants/klayswap-lp-pools.json';
import KOKONUTSWAP_LP_POOLS from '@/defi/constants/kokonutswap-lp-pools.json';
import { KlaySwap } from '@/defi/klayswap';
import { KokonutSwap } from '@/defi/kokonutswap';
import { DeFiStaking } from '@/defi/types/staking';

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

const klaytnChain = new KlaytnChain();

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

  console.log(tokenBalances);

  let stakings: DeFiStaking[] = [];
  for (const token of tokenBalances) {
    if (token.balance === null) {
      // Indexed at least once
      continue;
    }

    // KLAYswap LP
    const klayswapLPPool = KLAYSWAP_LP_POOLS.find((v) =>
      isSameAddress(v.exchange_address, token.contract_address),
    );
    if (!!klayswapLPPool) {
      const staking = await KlaySwap.getLPPoolBalance(
        walletAddress,
        token.balance,
        klayswapLPPool,
      );
      console.log({ staking });
      stakings.push(staking);
      continue;
    }

    // KLAYswap Leverage Pool (Single Staking)
    const klayswapLeveragePool = KLAYSWAP_LEVERAGE_POOLS.find((v) =>
      isSameAddress(v.address, token.contract_address),
    );
    if (!!klayswapLeveragePool) {
      console.log('klayswapLeveragePool');
      const staking = await KlaySwap.getSinglePoolBalance(
        walletAddress,
        token.balance,
        klayswapLeveragePool,
        dynamicLeveragePools?.find(
          (v) => v.address === klayswapLeveragePool.address,
        ),
      );
      console.log({ staking });
      stakings.push(staking);
      continue;
    }

    // KLAYswap Governance
    if (isSameAddress(token.contract_address, KlaySwap.VOTING_KSP_ADDRESS)) {
      console.log('klayswapGovernance');
      const staking = await KlaySwap.getGovernanceStake(
        walletAddress,
        token.balance,
      );
      console.log({ staking });
      stakings.push(staking);
      continue;
    }

    // Kokonutswap LP
    const kokonutswapLPPool = KOKONUTSWAP_LP_POOLS.find((v) =>
      isSameAddress(v.lpTokenAddress, token.contract_address),
    );
    if (!!kokonutswapLPPool) {
      console.log('kokonutswapLPPool');
      const staking = await KokonutSwap.getLPPoolBalance(
        walletAddress,
        token.balance,
        kokonutswapLPPool,
        KOKONUTSWAP_LP_POOLS,
      );
      console.log({ staking });
      stakings.push(staking);
      continue;
    }

    // Kokonutswap Governance
    if (
      isSameAddress(token.contract_address, KokonutSwap.STAKED_KOKOS_ADDRESS)
    ) {
      console.log('kokonutswapGovernance');
      const staking = await KokonutSwap.getGovernanceStake(
        walletAddress,
        token.balance,
      );
      console.log({ staking });
      stakings.push(staking);
      continue;
    }
  }

  res.status(200).json(stakings);
};

export default withCORS(handler);
