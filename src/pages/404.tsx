import { history } from '@umijs/max';
import { Button, Result } from 'antd';
import React from 'react';
import {FormattedMessage} from "@@/exports";

const NoFoundPage: React.FC = () => (
  <Result
    status="404"
    title="404"
    subTitle={<FormattedMessage id="home.status.404" />}
    extra={
      <Button type="primary" onClick={() => history.push('/')}>
        <FormattedMessage id="home.status.back_home" />
      </Button>
    }
  />
);

export default NoFoundPage;
