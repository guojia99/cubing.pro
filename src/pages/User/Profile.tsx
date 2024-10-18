import { Auth, checkAuth } from '@/pages/User/AuthComponents';
import AvatarWithUpdate from '@/pages/User/ProfileComponent/Avatar';
import UserInfo from '@/pages/User/ProfileComponent/UserInfo';
import React from 'react';


const Profile: React.FC = () => {
  const user = checkAuth([Auth.AuthAdmin, Auth.AuthSuperAdmin]);
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
