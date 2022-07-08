import axios from 'axios';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import { AssetRatioListItem } from '@/dashboard/components/AssetRatioListItem';

import { FieldInput } from '../components/FieldInput';
import { FieldTextArea } from '../components/FieldTextArea';
import { ExampleUserProfile } from '../constants/ExampleUserProfile';
import { ProfileLink } from '../types/UserProfile';
import { Preview } from './components/Preview';
import { ProfileLinkEditItem } from './components/ProfileLinkEditItem';
import { TabBar } from './components/TabBar';

const ManagePage = () => {
  const [username, setUsername] = useState<string>(ExampleUserProfile.username);
  const [display_name, setDisplayName] = useState<string>(
    ExampleUserProfile.display_name,
  );
  const [bio, setBio] = useState<string>(ExampleUserProfile.bio);
  const [links, setLinks] = useState<ProfileLink[]>(ExampleUserProfile.links);

  const profileDraft = useMemo(
    () => ({ ...ExampleUserProfile, username, display_name, bio, links }),
    [username, display_name, bio, links],
  );

  const onSubmit = useCallback(async () => {
    const { data } = await axios.post(`/api/profile`, {
      username,
      display_name,
      bio,
      links,
    });
    console.log(data);
  }, [username, display_name, bio, links]);

  return (
    <>
      <Wrapper>
        <Preview profileDraft={profileDraft} />
        <EditorWrapper>
          <TabBar onClick={onSubmit} />
          <Container>
            <ProfileContainer id="profile">
              <FieldInput
                field="사용자 이름"
                placeholder="여러분의 링크에 들어가는 이름이에요"
                defaultValue={ExampleUserProfile.username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <FieldInput
                field="프로필에 보여질 이름"
                placeholder="당신의 이름을 적어주세요"
                defaultValue={ExampleUserProfile.display_name}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <FieldTextArea
                field="한 줄 소개"
                placeholder="한 문장으로 당신을 표현해 주세요"
                defaultValue={ExampleUserProfile.bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </ProfileContainer>
            <ProfileLinkList id="links">
              {links.map((item, index) => {
                return (
                  <ProfileLinkEditItem
                    key={`item-${index}`}
                    linkDraft={item}
                    defaultLink={ExampleUserProfile.links[index]}
                    onChange={(updated) =>
                      setLinks(
                        links.map((link, i) => (i === index ? updated : link)),
                      )
                    }
                  />
                );
              })}
            </ProfileLinkList>
          </Container>
        </EditorWrapper>
      </Wrapper>
    </>
  );
};

export default ManagePage;

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  background-color: #111319;
  display: flex;
`;

const EditorWrapper = styled.div`
  height: 100vh;
  margin-left: auto;
  width: 38vw;
  background-color: #171c21;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
`;

const Container = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 36px 48px;
`;

const ProfileContainer = styled.div`
  padding-top: 28px;
  display: flex;
  flex-direction: column;
`;

const ProfileLinkList = styled.ul`
  margin: 16px 0 0;
  padding: 0;
`;
