import BackButton from '@/components/Buttons/back_button';
import { CompsTableColumns } from '@/components/Data/cube_comps/comps_tables';
import { Comp } from '@/components/Data/types/comps';
import { rowClassNameWithStyleLines } from '@/components/Table/table_style';
import { Auth, checkAuth } from '@/pages/Admin/AuthComponents/AuthComponents';
import { apiApprovalComp } from '@/services/cubing-pro/auth/admin';
import {apiEndComp, apiGetComps, apiMeOrganizers} from '@/services/cubing-pro/auth/organizers';
import { OrganizersAPI } from '@/services/cubing-pro/auth/typings';
import { CompsAPI } from '@/services/cubing-pro/comps/typings';
import { history } from '@@/core/history';
import { ProTable } from '@ant-design/pro-table';
import { ProColumns } from '@ant-design/pro-table/es/typing';
import { Link } from '@umijs/max';
import { Button, Modal, Select, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const OrganizersComps: React.FC = () => {
  const [org, setOrg] = useState<OrganizersAPI.MeOrganizersResp | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [curOrg, setCurOrg] = useState<OrganizersAPI.organizer | null>(null);
  const [compsCount, setCompsCount] = useState(0);
  const adminUser = checkAuth([Auth.AuthAdmin, Auth.AuthSuperAdmin]);
  const actionRef = useRef();

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

  const OptCompsTableColumns: ProColumns<Comp>[] = [
    {
      title: '操作',
      width: 150,
      render: (value: any, result: Comp) => {
        let buttons: JSX.Element[] = [];

        if (!result.IsDone && result.Status === 'Running') {
          // buttons.push(
          //   <Button
          //     style={{ backgroundColor: '#7cb305', fontWeight: 700, color: '#ffc', border: 'none' }}
          //     size={'small'}
          //     autoInsertSpace={false}
          //   >
          //     修改
          //   </Button>,
          // );
          buttons.push(
            <Button
              style={{ backgroundColor: '#4ba3f6', fontWeight: 700, color: '#ffc', border: 'none' }}
              size={'small'}
              autoInsertSpace={false}
              onClick={() => {
                history.replace({ pathname: '/admin/organizers/' + curOrg?.id + '/comp/' + result.id + '/result' });
              }}
            >
              录入
            </Button>,
          );

          const handleEnd = async () => {
            if (!curOrg){
              return
            }
            apiEndComp(curOrg.id, result.id).then(() => {
              // @ts-ignore
              actionRef.current?.reload();
              message.success("结束")
            }).catch((e) => {
              message.error(e)
            })
          }


          const showEnd = () => {
            Modal.warning({
              title: '确认结束比赛',
              content: '您确定要结束该比赛吗？结束后将无法恢复。',
              okText: '确认结束',
              cancelText: '取消',
              onOk: handleEnd, // 点击确认后执行结束操作
            })
          }
          buttons.push(
            <Button
              style={{ backgroundColor: '#ff3bac', fontWeight: 700, color: '#ffc', border: 'none' }}
              size={'small'}
              onClick={showEnd}
              autoInsertSpace={false}
            >
              结束
            </Button>,
          );
        }

        if (adminUser !== null && result.Status === 'Reviewing') {
          const handleApproval = async () => {
            apiApprovalComp(result.id).then(() => {
              // @ts-ignore
              actionRef.current?.reload();
              message.success("审批通过")
            }).catch((e) => {
              message.error(e)
            })
          };

          const showConfirm = () => {
            Modal.warning({
              title: '确认审批',
              content: '确认要通过' + result.Name + '的比赛申请吗?',
              okText: '确认',
              cancelText: '取消',
              onOk: handleApproval,
            });
          };

          buttons.push(
            <Button
              style={{ backgroundColor: '#faad14', fontWeight: 700, color: '#ffc', border: 'none' }}
              size={'small'}
              autoInsertSpace={false}
              onClick={showConfirm}
            >
              审批
            </Button>,
          );
        }

        if (adminUser !== null && result.Status === 'Running') {
          buttons.push(
            <Button
              style={{ backgroundColor: '#ff0000', fontWeight: 700, color: '#ffc', border: 'none' }}
              size={'small'}
              autoInsertSpace={false}
            >
              删除
            </Button>,
          );
        }

        const spacedButtons = buttons.flatMap((btn, index) =>
          index < buttons.length - 1
            ? [btn, <span key={`spacer-${index}`} style={{ width: 5, display: 'inline-block' }} />]
            : [btn],
        );

        return <>{spacedButtons}</>;
      },
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 30 }}>
        {BackButton('返回上层')}
        <Link to={'/admin/organizers/comps/create'} style={{ marginRight: 20, marginLeft: 20 }}>
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
            actionRef={actionRef}
            title={() => {
              return (
                <h2>
                  {curOrg?.Name} 举办的比赛 (数量{compsCount})
                </h2>
              );
            }}
            size="small"
            columns={[...CompsTableColumns, ...OptCompsTableColumns]}
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
              setCompsCount(comps.length);
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
