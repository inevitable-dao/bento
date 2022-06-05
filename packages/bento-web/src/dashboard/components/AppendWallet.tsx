import { WALLET_TYPES, Wallet } from '@bento/core/lib/types';
import clsx from 'clsx';
import produce from 'immer';
import React, { useCallback, useMemo, useState } from 'react';
import { useRecoilState } from 'recoil';
import styled from 'styled-components';

import { walletsAtom } from '@/recoil/wallets';

const CHAINS_BY_WALLET_TYPE = {
  evm: ['ethereum', 'polygon', 'klaytn'],
  'cosmos-sdk': ['cosmos', 'osmosis'],
  solana: [],
} as const;

type WalletDraft = {
  type: string;
  address: string;
  chains: string[];
};
const defaultWallet: WalletDraft = {
  type: '',
  address: '',
  chains: [],
};

export const AppendWallet: React.FC = () => {
  const [wallets, setWallets] = useRecoilState(walletsAtom);
  const [draft, setDraft] = useState<WalletDraft>(defaultWallet);

  const handleChains = useCallback(
    (chainId: string) => {
      if (draft.type === 'solana') {
        return;
      }
      const previousChains: string[] = draft.chains;
      const chains = previousChains.includes(chainId)
        ? previousChains.filter((v) => v !== chainId)
        : [...previousChains, chainId];

      setDraft({ ...draft, chains });
    },
    [draft],
  );

  const handleSave = useCallback(() => {
    // 이미 있는 지갑을 추가한 경우, 체인만 업데이트
    const duplicatedWallet = wallets.find((v) => v.address === draft.address);
    if (duplicatedWallet) {
      setWallets((prev) =>
        produce(prev, (walletsDraft) => {
          walletsDraft.forEach((wallet) => {
            if (wallet.address === draft.address && wallet.type !== 'solana') {
              wallet.chains = Array.from(
                new Set([...(draft.chains as any), ...wallet.chains]),
              );
            }
          });
        }),
      );
      setDraft(defaultWallet);
      return;
    }

    setWallets((prev) => [...prev, draft as Wallet]);
    setDraft(defaultWallet);
  }, [draft]);

  const supportedChains = useMemo(() => {
    if (!draft.type) {
      return [];
    }
    const chains = CHAINS_BY_WALLET_TYPE[draft.type];
    return chains.length > 0 //
      ? chains
      : [];
  }, [draft.type]);

  return (
    <div
      className={clsx(
        'mt-6 mb-2 p-4 h-fit overflow-hidden',
        'border border-slate-700 rounded-md drop-shadow-2xl',
        'bg-slate-800/25 backdrop-blur-md flex flex-col cursor-pointer',
      )}
    >
      <div className="flex flex-col h-auto text-slate-50/90">
        <div className="flex flex-wrap">
          {Object.values(WALLET_TYPES).map((arch) => (
            <button
              key={arch.type}
              className={clsx(
                'flex flex-col items-center flex-1',
                'p-2 rounded-md border-2 transition-all',
                draft.type === arch.type
                  ? 'border-white'
                  : 'border-transparent',
              )}
              type="button"
              onClick={() => setDraft({ ...draft, type: arch.type })}
            >
              <ArchImage
                className="ring-1 ring-slate-100/25"
                alt={arch.type}
                src={arch.logo}
              />
              <span className="mt-2 leading-none">{arch.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-3">
          <input
            type="text"
            className="w-full p-3 px-4 rounded-md bg-slate-800"
            name="Address"
            placeholder="Address"
            value={draft.address}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setDraft({ ...draft, address: event.target.value })
            }
          />
        </div>
        {draft.type !== 'solana' && (
          <div>
            {supportedChains.map((chainId: string) => (
              <span key={chainId}>
                <button
                  className={clsx(
                    'p-1 px-2 rounded-md border',
                    draft.chains.includes(chainId)
                      ? 'border-white'
                      : 'border-transparent',
                  )}
                  type="button"
                  onClick={() => handleChains(chainId)}
                >
                  {chainId.toUpperCase()}
                </button>
              </span>
            ))}
          </div>
        )}
        <button
          className="mt-2 p-2 px-4 w-fit font-bold text-slate-800 bg-slate-200 rounded-md"
          type="button"
          onClick={handleSave}
        >
          Add Wallet
        </button>
      </div>
    </div>
  );
};

const ArchImage = styled.img`
  width: 54px;
  min-width: 54px;
  max-width: 54px;
  height: 54px;

  background: white;
  filter: drop-shadow(0px 4.25px 4.25px rgba(0, 0, 0, 0.25));
  border-radius: 157.781px;
`;
