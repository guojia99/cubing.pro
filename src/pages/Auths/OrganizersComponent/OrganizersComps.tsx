import { CompsTableColumns } from '@/components/Data/cube_comps/comps_tables';
import { Comp } from '@/components/Data/types/comps';
import { rowClassNameWithStyleLines } from '@/components/Table/table_style';
import { apiGetComps, apiMeOrganizers } from '@/services/cubing-pro/auth/organizers';
import { OrganizersAPI } from '@/services/cubing-pro/auth/typings';
import { CompsAPI } from '@/services/cubing-pro/comps/typings';
import { history } from '@@/core/history';
import { ProTable } from '@ant-design/pro-table';
import { Link } from '@umijs/max';
import { Button, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';

const OrganizersComps: React.FC = () => {
  const [org, setOrg] = useState<OrganizersAPI.MeOrganizersResp | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [curOrg, setCurOrg] = useState<OrganizersAPI.organizer | null>(null);
  const [compsCount, setCompsCount] = useState(0);

  useEffect(() => {
    if (org === null) {
      apiMeOrganizers().then((value: OrganizersAPI.MeOrganizersResp) => {
        if (value.data.items.length >= 0) {
          setCurOrg(value.data.items[0]);
        }
        setOrg(value);
        setLoading(false);
      });
    }
  }, []);

  // 检查用户是否加入了团队
  useEffect(() => {
    if (org?.data.items === null || org?.data.items?.length === 0) {
      message.warning('你还未加入任何团队，请加入后再创建比赛').then();
      history.replace({ pathname: '/user/organizers' });
    }
  }, [org]);

  return (
    <>
      <div style={{ marginBottom: 30 }}>
        <Link to={'/user/organizers/comps/create'} style={{ marginRight: 20 }}>
          <Button type="default" className="create-comp-btn">
            创建比赛
          </Button>
        </Link>
        {!loading && (
          <>
            <Select
              placeholder="选择所在团队名称"
              style={{ width: 200 }}
              defaultValue={org?.data.items[0]?.id} // 默认选中第一个组织
              onChange={(value: number) => {
                const selectedOrg = org?.data.items.find((o) => o.id === value) || null;
                setCurOrg(selectedOrg);
              }}
            >
              {org?.data.items.map((o) => (
                <Select.Option key={o.id} value={o.id}>
                  {o.Name}
                </Select.Option>
              ))}
            </Select>
          </>
        )}
      </div>
      {!loading && (
        <>
          <ProTable<Comp, CompsAPI.CompsReq>
            key={curOrg?.id}
            title={() => {
              return <h2>{curOrg?.Name} 举办的比赛 (数量{compsCount})</h2>;
            }}
            size="small"
            columns={CompsTableColumns}
            rowClassName={rowClassNameWithStyleLines}
            request={async () => {
              // @ts-ignore
              const value = await apiGetComps(curOrg?.id);
              let comps = value.data.items;
              comps = comps.sort((a: Comp, b: Comp) => {
                if (a.IsDone && !b.IsDone) return 1;
                if (!a.IsDone && b.IsDone) return -1;
                return 0;
              });
              for (let i = 0; i < comps.length; i++) {
                comps[i].Index = i + 1;
              }
              setCompsCount(comps.length)
              return { data: comps, success: true, total: value.data.total };
            }}
            search={false}
            pagination={false}
            options={false}
            sticky
          />
        </>
      )}
    </>
  );
};

export default OrganizersComps;
