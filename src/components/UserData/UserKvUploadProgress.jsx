import { Progress } from 'antd';
import React from 'react';
/**
 * 个人 KV 上传等场景共用的进度条（Ant Design Progress 薄封装）
 */
export const UserKvUploadProgress = ({ percent, status = 'active', }) => {
    if (percent === undefined) {
        return null;
    }
    return (<Progress percent={percent} size="small" status={percent >= 100 ? 'success' : status === 'exception' ? 'exception' : 'active'} style={{ maxWidth: 360 }}/>);
};
//# sourceMappingURL=UserKvUploadProgress.jsx.map