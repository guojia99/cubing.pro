"use client";

import "antd/dist/reset.css";

import { Button, Input, Modal, Select, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties } from "react";

import BackButton from "@/components/Buttons/back_button";
import { CompsTableColumns } from "@/components/Data/cube_comps/comps_tables";
import type { Comp } from "@/components/Data/types/comps";
import { rowClassNameWithStyleLines } from "@/components/Table/table_style";
import { useAuth } from "@/contexts/AuthProvider";
import { Auth, hasAnyAuth } from "@/lib/auth";
import { apiAdminDeleteComp, apiApprovalComp } from "@/services/cubing-pro/auth/admin";
import { ADMIN_LEGACY } from "@/theme/domainColors";
import {
  apiEndComp,
  apiGetComps,
  apiMeOrganizers,
  apiUpdateCompName,
} from "@/services/cubing-pro/auth/organizers";
import type { OrganizersAPI } from "@/services/cubing-pro/auth/typings";

/** antd legacy action button — whitelist: ADMIN_LEGACY */
const adminActionBtn = (bg: string): CSSProperties => ({
  backgroundColor: bg,
  fontWeight: 700,
  color: ADMIN_LEGACY.buttonTextOnColor,
  border: "none",
});

export function OrganizersCompsPageView() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const isAdmin =
    currentUser &&
    hasAnyAuth(currentUser.Auth, [Auth.AuthAdmin, Auth.AuthSuperAdmin]);

  const [org, setOrg] = useState<OrganizersAPI.MeOrganizersResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [curOrg, setCurOrg] = useState<OrganizersAPI.organizer | null>(null);
  const [compsCount, setCompsCount] = useState(0);
  const [comps, setComps] = useState<Comp[]>([]);
  const [tableLoading, setTableLoading] = useState(false);

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
  }, [org]);

  useEffect(() => {
    if (org?.data.items === null || org?.data.items?.length === 0) {
      void message.warning("你还未加入任何团队，请加入后再创建比赛");
      router.replace("/admin/organizers");
    }
  }, [org, router]);

  const reloadComps = useCallback(async () => {
    if (!curOrg) return;
    setTableLoading(true);
    try {
      const value = await apiGetComps(curOrg.id);
      let items = value.data.items;
      items = items.sort((a: Comp, b: Comp) => {
        if (a.IsDone && !b.IsDone) return 1;
        if (!a.IsDone && b.IsDone) return -1;
        return 0;
      });
      for (let i = 0; i < items.length; i++) {
        items[i].Index = i + 1;
      }
      setComps(items);
      setCompsCount(items.length);
    } finally {
      setTableLoading(false);
    }
  }, [curOrg]);

  useEffect(() => {
    void reloadComps();
  }, [reloadComps]);

  const optCompsTableColumns: ColumnsType<Comp> = [
    {
      title: "操作",
      width: 150,
      render: (_value, result: Comp) => {
        const buttons: React.ReactNode[] = [];

        const showUpdateNameModal = () => {
          let newName = result.Name;

          Modal.confirm({
            title: "修改比赛名称",
            content: (
              <Input
                defaultValue={result.Name}
                onChange={(e) => {
                  newName = e.target.value;
                }}
                placeholder="请输入新的比赛名称"
              />
            ),
            okText: "确认修改",
            cancelText: "取消",
            onOk: async () => {
              if (!curOrg) return;

              try {
                await apiUpdateCompName(curOrg.id, result.id, newName);
                void reloadComps();
                void message.success("名称已更新");
              } catch (e) {
                void message.error(`更新失败: ${e}`);
              }
            },
          });
        };

        buttons.push(
          <Button
            key="rename"
            style={adminActionBtn(ADMIN_LEGACY.actionCyan)}
            size="small"
            onClick={showUpdateNameModal}
          >
            改名
          </Button>,
        );

        if (!result.IsDone && result.Status === "Running") {
          buttons.push(
            <Button
              key="result"
              style={adminActionBtn(ADMIN_LEGACY.actionBlue)}
              size="small"
              onClick={() => {
                router.replace(
                  `/admin/organizers/${curOrg?.id}/comp/${result.id}/result`,
                );
              }}
            >
              录入
            </Button>,
          );

          const handleEnd = async () => {
            if (!curOrg) {
              return;
            }
            apiEndComp(curOrg.id, result.id)
              .then(() => {
                void reloadComps();
                void message.success("结束");
              })
              .catch((e) => {
                void message.error(String(e));
              });
          };

          const showEnd = () => {
            Modal.warning({
              title: "确认结束比赛",
              content: "您确定要结束该比赛吗？结束后将无法恢复。",
              okText: "确认结束",
              cancelText: "取消",
              onOk: handleEnd,
            });
          };
          buttons.push(
            <Button
              key="end"
              style={adminActionBtn(ADMIN_LEGACY.actionPink)}
              size="small"
              onClick={showEnd}
            >
              结束
            </Button>,
          );
        }

        if (isAdmin && result.Status === "Reviewing") {
          const handleApproval = async () => {
            apiApprovalComp(result.id)
              .then(() => {
                void reloadComps();
                void message.success("审批通过");
              })
              .catch((e) => {
                void message.error(String(e));
              });
          };

          const showConfirm = () => {
            Modal.warning({
              title: "确认审批",
              content: `确认要通过${result.Name}的比赛申请吗?`,
              okText: "确认",
              cancelText: "取消",
              onOk: handleApproval,
            });
          };

          buttons.push(
            <Button
              key="approval"
              style={adminActionBtn(ADMIN_LEGACY.warningGold)}
              size="small"
              onClick={showConfirm}
            >
              审批
            </Button>,
          );
        }

        if (isAdmin) {
          const showDeleteCompModal = () => {
            let confirmName = "";
            Modal.confirm({
              title: "删除比赛",
              width: 520,
              content: (
                <div>
                  <p style={{ marginBottom: 12, color: ADMIN_LEGACY.dangerText }}>
                    此操作将永久删除该比赛及其全部成绩（含预录入）、站点纪录、报名与赞助关联等数据，且不可恢复。
                  </p>
                  <p style={{ marginBottom: 8 }}>请输入比赛名称「{result.Name}」以确认：</p>
                  <Input
                    placeholder="输入比赛全称"
                    onChange={(e) => {
                      confirmName = e.target.value;
                    }}
                  />
                </div>
              ),
              okText: "确认删除",
              okButtonProps: { danger: true },
              cancelText: "取消",
              onOk: async () => {
                if (confirmName.trim() !== result.Name.trim()) {
                  void message.error("比赛名称不一致，请重新输入");
                  return Promise.reject();
                }
                try {
                  await apiAdminDeleteComp(result.id);
                  void reloadComps();
                  void message.success("比赛已删除");
                } catch (e) {
                  void message.error(`删除失败: ${e}`);
                  return Promise.reject();
                }
              },
            });
          };

          buttons.push(
            <Button
              key="delete"
              style={adminActionBtn(ADMIN_LEGACY.pureRed)}
              size="small"
              onClick={showDeleteCompModal}
            >
              删除
            </Button>,
          );
        }

        const spacedButtons = buttons.flatMap((btn, index) =>
          index < buttons.length - 1
            ? [btn, <span key={`spacer-${index}`} style={{ width: 5, display: "inline-block" }} />]
            : [btn],
        );

        return <>{spacedButtons}</>;
      },
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 30 }}>
        {BackButton("返回上层")}
        <NextLink href="/admin/organizers/comps/create" style={{ marginRight: 20, marginLeft: 20 }}>
          <Button type="default" className="create-comp-btn">
            创建比赛
          </Button>
        </NextLink>
        {!loading && (
          <Select
            placeholder="选择所在团队名称"
            style={{ width: 200 }}
            defaultValue={org?.data.items[0]?.id}
            onChange={(value: number) => {
              const selectedOrg = org?.data.items.find((o) => o.id === value) || null;
              setCurOrg(selectedOrg);
            }}
            options={org?.data.items.map((o) => ({
              key: o.id,
              value: o.id,
              label: o.Name,
            }))}
          />
        )}
      </div>
      {!loading && (
        <>
          <h2 style={{ marginBottom: 16 }}>
            {curOrg?.Name} 举办的比赛 (数量{compsCount})
          </h2>
          <Table<Comp>
            key={curOrg?.id}
            size="small"
            columns={[...CompsTableColumns, ...optCompsTableColumns]}
            dataSource={comps}
            rowKey="id"
            loading={tableLoading}
            rowClassName={rowClassNameWithStyleLines}
            pagination={false}
            scroll={{ x: "max-content" }}
            sticky
          />
        </>
      )}
    </>
  );
}
