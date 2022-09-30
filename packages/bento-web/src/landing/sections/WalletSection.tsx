import { useTranslation } from 'next-i18next';
import Image from 'next/future/image';
import React from 'react';
import styled from 'styled-components';

import { TrackedSection, TrackedSectionOptions } from '@/components/system';

import { WALLETS } from '@/constants/wallets';

import { SectionBadge } from '../components/SectionBadge';
import { SectionTitle } from '../components/SectionTitle';
import { onMobile, onTablet } from '../utils/breakpoints';

export const WalletSection: React.FC<TrackedSectionOptions> = ({
  ...trackedSectionOptions
}) => {
  const { t } = useTranslation('landing');

  return (
    <Wrapper>
      <Container {...trackedSectionOptions}>
        <SectionBadge>{t('Wallets')}</SectionBadge>
        <SectionTitle>
          Manage and Share
          <br />
          Your Wallets
        </SectionTitle>

        <WalletList>
          {Object.entries(WALLETS).map(([alt, src]) => (
            <li key={src}>
              <WalletIcon alt={alt} src={src} />
            </li>
          ))}
        </WalletList>

        <WalletIllustWrapper>
          <WalletIllust
            alt=""
            width={526}
            height={526}
            src="/assets/dashboard-landing/illusts/wallet.png"
          />
        </WalletIllustWrapper>
      </Container>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  padding: 130px 32px 0;
  width: 100%;
  display: flex;

  @media (max-width: 1235px) {
    padding-top: 64px;
  }
`;
const Container = styled(TrackedSection)`
  margin: 0 auto;
  max-width: 1180px;
  width: 100%;
  position: relative;
`;

const WalletList = styled.ul`
  margin: 24px 0 0;
  padding: 0;
  list-style-type: none;

  display: flex;
  gap: 8px;

  @media screen and (max-width: 600px) {
    gap: 6px;
  }

  ${onMobile} {
    margin-top: 0;
    gap: 4px;
  }
`;
const WalletIcon = styled.img`
  width: 128px;
  height: 128px;

  @media screen and (max-width: 800px) {
    width: 100px;
    height: 100px;
  }

  @media screen and (max-width: 600px) {
    width: 86px;
    height: 86px;
  }

  ${onMobile} {
    width: 64px;
    height: 64px;
  }

  @media screen and (max-width: 368px) {
    width: 56px;
    height: 56px;
  }
`;

const WalletIllustWrapper = styled.div`
  margin-top: -108px;
  display: flex;
  width: fit-content;
  height: fit-content;
`;
const WALLET_TOP_BLUR_SIZE = 50;
const WALLET_RIGHT_BLUR_SIZE = 152.68;
const WalletIllust = styled(Image)`
  margin-top: ${-WALLET_TOP_BLUR_SIZE}px;
  margin-right: ${-WALLET_RIGHT_BLUR_SIZE}px;
  width: ${526 + WALLET_RIGHT_BLUR_SIZE}px;
  height: ${526 + WALLET_TOP_BLUR_SIZE}px;
  object-fit: contain;
  user-select: none;
  filter: saturate(120%);
`;