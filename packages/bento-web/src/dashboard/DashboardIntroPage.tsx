import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { PageContainer } from '@/components/PageContainer';
import { MetaHead } from '@/components/system';
import { useSession } from '@/hooks/useSession';
import { useWalletContext } from '@/hooks/useWalletContext';

import { Analytics } from '@/utils';

import { DashboardIntro } from './DashboardIntro';
import { TokenDetailModalParams } from './components/TokenDetailModal';

const DynmaicAddWalletModal = dynamic(
  () => import('./components/AddWalletModal'),
);
const DynamicTokenDetailModal = dynamic(
  () => import('./components/TokenDetailModal'),
);

export const getStaticProps: GetStaticProps = async ({ locale = 'en' }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'dashboard'])),
    },
  };
};

const DashboardPage = () => {
  const { session } = useSession();
  const { wallets } = useWalletContext();

  const [isAddWalletModalVisible, setAddWalletModalVisible] =
    useState<boolean>(false);
  const [isTokenDetailModalVisible, setTokenDetailModalVisible] =
    useState<boolean>(false);
  const [tokenDetailModalParams, setTokenDetailModalParams] =
    useState<TokenDetailModalParams>({});

  const [pageLoaded, setPageLoaded] = useState<boolean>(false);
  useEffect(() => setPageLoaded(true), []);

  const hasWallet = !!session && wallets.length > 0;

  const hasLoggedTabViewEvent = useRef<boolean>(false);
  useEffect(() => {
    if (!hasLoggedTabViewEvent.current) {
      Analytics.logEvent('view_dashboard_tab', undefined);
    }
    hasLoggedTabViewEvent.current = true;
  }, []);

  const hasLoggedViewEvent = useRef<boolean>(false);
  useEffect(() => {
    if (!pageLoaded || hasLoggedViewEvent.current) {
      return;
    }

    if (!session) {
      return;
    } else {
      Analytics.logEvent('view_dashboard_main', undefined);
      hasLoggedViewEvent.current = true;
    }
  }, [pageLoaded, hasWallet]);

  return (
    <>
      <MetaHead />
      <Black />
      <PageContainer style={{ paddingTop: 0 }}>
        <DashboardIntro
          onConnectWallet={() => setAddWalletModalVisible((prev) => !prev)}
        />

        <DynmaicAddWalletModal
          visible={isAddWalletModalVisible}
          onDismiss={() => setAddWalletModalVisible((prev) => !prev)}
        />
        <DynamicTokenDetailModal
          visible={isTokenDetailModalVisible}
          onDismiss={() => {
            setTokenDetailModalVisible((prev) => !prev);
            setTokenDetailModalParams({});
          }}
          {...tokenDetailModalParams}
        />
      </PageContainer>
    </>
  );
};

export default DashboardPage;

const Black = styled.div`
  width: 100%;
  height: 64px;
  background-color: rgba(0, 0, 0, 0.5);
`;
