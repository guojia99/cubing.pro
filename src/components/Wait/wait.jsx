import ProSkeleton from '@ant-design/pro-skeleton';
import React from "react";
const Loading = () => {
    return (<div style={{ background: '#fafafa', padding: 24, }}><ProSkeleton type="list"/></div>);
};
export const IfLoading = (loading, children) => {
    if (loading) {
        return <Loading />;
    }
    return children;
};
export default Loading;
//# sourceMappingURL=wait.jsx.map