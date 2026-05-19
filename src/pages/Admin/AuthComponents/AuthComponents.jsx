import { history, useModel } from '@@/exports';
import { stringify } from 'querystring';
import { message, Tag } from 'antd';
export var Auth;
(function (Auth) {
    Auth[Auth["AuthPlayer"] = 1] = "AuthPlayer";
    Auth[Auth["AuthOrganizers"] = 2] = "AuthOrganizers";
    Auth[Auth["AuthDelegates"] = 4] = "AuthDelegates";
    Auth[Auth["AuthAdmin"] = 8] = "AuthAdmin";
    Auth[Auth["AuthSuperAdmin"] = 16] = "AuthSuperAdmin";
})(Auth || (Auth = {}));
export function hasAuth(userAuth, requiredAuth) {
    return (userAuth & requiredAuth) === requiredAuth;
}
export function authTags(userAuth) {
    let out = [];
    if (hasAuth(userAuth, Auth.AuthSuperAdmin)) {
        out.push(<Tag color="orange">超级管理员</Tag>);
    }
    if (hasAuth(userAuth, Auth.AuthAdmin)) {
        out.push(<Tag color="magenta">管理员</Tag>);
    }
    if (hasAuth(userAuth, Auth.AuthDelegates)) {
        out.push(<Tag color="gold">代表</Tag>);
    }
    if (hasAuth(userAuth, Auth.AuthOrganizers)) {
        out.push(<Tag color="purple">主办</Tag>);
    }
    if (hasAuth(userAuth, Auth.AuthPlayer)) {
        out.push(<Tag color="green">玩家</Tag>);
    }
    return out;
}
export function checkAuth(requiredAuths) {
    const { initialState, setInitialState } = useModel('@@initialState');
    // @ts-ignore
    const { currentUser } = initialState;
    if (currentUser === null || currentUser === undefined) {
        message.warning('请先登陆帐号后访问').then();
        const { pathname, search } = window.location;
        history.replace({
            pathname: '/login',
            search: stringify({ redirect: pathname + search }),
        });
        return null;
    }
    const user = currentUser;
    let has = false;
    for (let i = 0; i < requiredAuths.length; i++) {
        if (hasAuth(user.data.Auth, requiredAuths[i])) {
            has = true;
        }
    }
    if (!has) {
        return null;
    }
    return user;
}
//# sourceMappingURL=AuthComponents.jsx.map