import { PageContainer } from '@ant-design/pro-components';
import { useSearchParams } from '@@/exports';
import { Result } from 'antd';
import React from 'react';
import { getAdByKey } from './config';

/**
 * 广告详情页：/advertisement?key=xxx
 */
const Advertisement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key') || '';

  const ad = getAdByKey(key);

  if (!ad) {
    return (
      <PageContainer>
        <Result
          status="404"
          title="广告不存在"
          subTitle={`未找到 key="${key}" 对应的广告`}
        />
      </PageContainer>
    );
  }

  const FullContent = ad.FullContent;

  return (
    <PageContainer header={false}>
      <FullContent />
    </PageContainer>
  );
};

export default Advertisement;
