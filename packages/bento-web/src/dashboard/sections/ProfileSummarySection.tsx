import { AxiosError } from 'axios';
import { useTranslation } from 'next-i18next';
import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Button, Modal } from '@/components/system';
import { formatUsername } from '@/utils/format';

import { LinkBlock } from '@/profile/blocks';
import { LinkBlockItem } from '@/profile/blocks/LinkBlockItem';
import {
  ProfileEditor,
  UserInformationDraft,
} from '@/profile/components/ProfileEditor';
import { UserProfile } from '@/profile/types/UserProfile';
import { Colors } from '@/styles';
import { Config, axios } from '@/utils';
import { Analytics, toast } from '@/utils';

type ErrorResponse =
  | {
      code: 'USERNAME_UNUSABLE' | 'VALUE_REQUIRED' | string;
      message: string;
    }
  | undefined;

type Props = {
  isMyProfile: boolean;
  imageToken: string;
  profile: UserProfile | null;
  revalidateProfile: () => void;
};

export const ProfileSummarySection: React.FC<Props> = ({
  isMyProfile,
  profile,
  imageToken,
  revalidateProfile,
}) => {
  const { t } = useTranslation('dashboard');

  const profileImageURL =
    profile?.images?.[0] || '/assets/mockups/profile-default.png';

  const [blocks, setBlocks] = useState<LinkBlock[]>([]);

  useEffect(() => {
    if (!profile) {
      return;
    }
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(
          `/api/profile/blocks/${profile.user_id}`,
        );
        if (Array.isArray(data)) {
          setBlocks(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchProfile();
  }, [profile]);

  const [isEditing, setEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<UserInformationDraft>({
    username: profile?.username ?? '',
    displayName: profile?.display_name ?? '',
    bio: profile?.bio ?? '',
  });

  useEffect(() => {
    setDraft({
      username: profile?.username ?? '',
      displayName: profile?.display_name ?? '',
      bio: profile?.bio ?? '',
    });
  }, [JSON.stringify(profile)]);

  const onProfileEdit = useCallback(async () => {
    if (!isEditing) {
      setDraft({
        username: profile?.username ?? '',
        displayName: profile?.display_name ?? '',
        bio: profile?.bio ?? '',
      });
      setTimeout(() => {
        setEditing(true);
      });
      return;
    }

    // FIXME: Duplicated logic
    try {
      const { data } = await axios.post(`/api/profile`, {
        username: draft.username.toLowerCase(),
        display_name: draft.displayName,
        bio: draft.bio,
      });
      console.log(data);

      setEditing(false);
      revalidateProfile?.();

      toast({
        type: 'success',
        title: 'Changes Saved',
      });
    } catch (e) {
      if (e instanceof AxiosError) {
        const errorResponse = e.response?.data as ErrorResponse;
        if (errorResponse?.code === 'USERNAME_UNUSABLE') {
          toast({
            type: 'error',
            title: errorResponse.message,
            description: 'Please choose another username',
          });
          setDraft((prev) => ({ ...prev, username: '' }));
        } else if (errorResponse?.code === 'VALUE_REQUIRED') {
          toast({
            type: 'error',
            title: errorResponse.message,
          });
        } else {
          toast({
            type: 'error',
            title: 'Server Error',
            description: errorResponse?.message || 'Something went wrong',
          });
        }
      }
    }
  }, [profile, isEditing, draft, revalidateProfile]);

  const onClickShareProfile = useCallback(async () => {
    console.log(imageToken);
    if (!profile?.user_id) {
      toast({
        type: 'error',
        title: 'Profile ID is invalid.',
        description: 'Sorry for the inconvenience. Please contact to the team.',
      });
    }
    const imageURL = `${Config.MAIN_API_BASE_URL}/api/images/card?token=${imageToken}&user_id=${profile?.user_id}`;
    console.log({ imageURL });
  }, [imageToken, profile?.user_id]);

  return (
    <Wrapper>
      <BorderWrapper className="profile-summary">
        <Container src={profileImageURL}>
          <Foreground>
            <ProfileImage src={profileImageURL} />
            <Information>
              {!profile?.username ? (
                <>
                  <EmptyText>{t('Update your Profile')}</EmptyText>
                  <Username>{formatUsername(profile?.username)}</Username>
                </>
              ) : (
                <>
                  {!!profile?.display_name && (
                    <Name>{profile?.display_name}</Name>
                  )}
                  <Username>{formatUsername(profile.username)}</Username>
                  {!!profile?.bio && <Bio>{profile?.bio}</Bio>}
                </>
              )}

              {isMyProfile && (
                <MinimalButton
                  onClick={() => {
                    Analytics.logEvent('click_edit_my_profile', {
                      title: 'Setup Now',
                      medium: 'dashboard_main',
                    });
                    setEditing((prev) => !prev);
                  }}
                >
                  {t(!profile?.username ? 'Setup Now' : 'Edit Profile')}
                </MinimalButton>
              )}
            </Information>
          </Foreground>
        </Container>
      </BorderWrapper>

      <ul>
        {blocks.map((block, index) => (
          <LinkBlockItem key={index} {...block} />
        ))}
      </ul>

      <MinimalButton onClick={onClickShareProfile}>Share</MinimalButton>

      <ProfileEditModal
        visible={isEditing}
        onDismiss={() => setEditing((prev) => !prev)}
      >
        <ProfileEditContainer>
          <ProfileEditor
            draft={draft}
            setDraft={setDraft}
            onSubmit={onProfileEdit}
          />
        </ProfileEditContainer>
      </ProfileEditModal>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BorderWrapper = styled.div`
  width: 100%;
  padding-bottom: 100%;

  position: relative;

  border-radius: 36px;
  background-color: #aaaaaa;
  background-image: radial-gradient(
    96.62% 96.62% at 10.25% 1.96%,
    #aaaaaa 0%,
    #282c30 37.71%,
    #787d83 100%
  );
`;

type ContainerProps = {
  src?: string;
};
const Container = styled.div`
  position: absolute;
  top: 1px;
  left: 1px;
  right: 1px;
  bottom: 1px;
  border-radius: 36px;

  background-color: black;
  background-image: url(${(props: ContainerProps) => props.src});
  background-size: cover;
  overflow: hidden;
  z-index: 0;
  transform: translate3d(0, 0, 0);

  &::before,
  &::after,
  & > div {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  &::before {
    z-index: 1;

    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(45px);
  }

  &::after {
    z-index: 2;

    background-image: url('/assets/profile/noise.png');
    background-size: 120px;
    background-repeat: repeat;
    opacity: 0.3;
  }
`;

const Foreground = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 3;
`;

const ProfileImage = styled.img`
  width: 128px;
  height: 128px;
  border-radius: 50%;
  user-select: none;
`;

const Information = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
const Name = styled.h3`
  font-weight: 900;
  font-size: 24px;
  line-height: 100%;
  text-align: center;
  color: ${Colors.white};
`;
const Username = styled.h4`
  font-weight: 600;
  font-size: 16px;
  line-height: 120%;
  text-align: center;
  color: #ff3856;
  color: ${Colors.brand400};
  letter-spacing: -0.05em;
`;
const Bio = styled.p`
  margin: 0 24px;
  font-weight: 400;
  font-size: 14px;
  line-height: 120%;
  text-align: center;
  color: ${Colors.gray200};

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const EmptyText = styled.span`
  font-weight: 600;
  font-size: 18px;
  line-height: 100%;
  text-align: center;
  letter-spacing: -0.05em;
  color: #ffffff;
`;

// FIXME: Design component
const MinimalButton = styled(Button)`
  && {
    margin: 8px auto 0;
    width: fit-content;
    height: unset;
    padding: 12px 18px;

    font-weight: 800;
    font-size: 14px;
    line-height: 100%;
    text-align: center;
    color: ${Colors.white};
  }
`;

// Duplicated
const ProfileEditModal = styled(Modal)`
  .modal-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;
const ProfileEditContainer = styled.div`
  padding: 32px 16px;
  width: 80vw;
  max-width: ${500 * 0.8}px;

  border-radius: 8px;
  background-color: rgba(38, 43, 52, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: default;
  user-select: none;
`;
