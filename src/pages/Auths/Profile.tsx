import { Auth, checkAuth } from '@/pages/Auths/AuthComponents';
import AvatarWithUpdate from '@/pages/Auths/ProfileComponent/Avatar';
import UserInfo from '@/pages/Auths/ProfileComponent/UserInfo';
import React from 'react';


const Profile: React.FC = () => {
  const user = checkAuth([Auth.AuthPlayer]);
  if (user === null) {
    return <>无权限</>;
  }

  return (
    <>
      {AvatarWithUpdate(user)}
      {UserInfo(user)}
    </>
  );
};

export default Profile;
