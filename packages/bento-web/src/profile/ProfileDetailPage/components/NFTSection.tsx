import { OpenSeaAsset } from '@bento/client';
import styled from 'styled-components';

import { AssetMedia } from '@/dashboard/components/AssetMedia';

type Props = {
  nftAssets: OpenSeaAsset[];
};

export const NFTSection: React.FC<Props> = ({ nftAssets }) => {
  return (
    <AssetList>
      {nftAssets.length > 0 ? (
        nftAssets.map((asset, index) => {
          const isVideo =
            !!asset.animation_url ||
            asset.image_url?.toLowerCase()?.endsWith('.mp4') ||
            false;

          return (
            <AssetListItem key={`${asset.id}-${index}`}>
              <AssetMedia
                src={
                  !isVideo
                    ? asset.image_url || asset.collection.image_url
                    : asset.animation_url
                }
                poster={
                  asset.image_url ||
                  asset.image_preview_url ||
                  asset.collection.image_url
                }
                isVideo={isVideo}
              />
              <AssetName className="text-sm text-gray-400">
                {asset.name || `#${asset.id}`}
              </AssetName>
            </AssetListItem>
          );
        })
      ) : (
        <Empty>No NFTs Found</Empty>
      )}
    </AssetList>
  );
};

// FIXME: Those are similar declares with `TokenDetailModal`
const AssetList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;
const AssetListItem = styled.li`
  display: flex;
  flex-direction: column;

  width: calc((100% - 24px) / 3);

  @media screen and (max-width: 32rem) {
    width: calc((100% - 12px) / 2);
  }
`;
const AssetName = styled.span`
  margin-top: 4px;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const Empty = styled.span`
  width: 100%;
  display: flex;
  justify-content: center;
  color: white;
`;