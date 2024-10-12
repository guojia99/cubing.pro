import { Link } from '@umijs/max';
import React from 'react';

const OrganizersComps: React.FC = () => {
  return (
    <>
      <Link to={'/user/organizers/create_comps'}>创建比赛</Link>
    </>
  );
};

export default OrganizersComps;
