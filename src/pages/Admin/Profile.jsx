import { Auth, checkAuth } from '@/pages/Admin/AuthComponents/AuthComponents';
import AvatarWithUpdate from '@/pages/Admin/ProfileComponent/Avatar';
import UserInfo from '@/pages/Admin/ProfileComponent/UserInfo';
import React from 'react';
const Profile = () => {
    const user = checkAuth([Auth.AuthPlayer]);
    if (user === null) {
        return <>无权限</>;
    }
    return (<>
      {AvatarWithUpdate(user)}
      {UserInfo(user)}
    </>);
};
export default Profile;
//# sourceMappingURL=Profile.jsx.map