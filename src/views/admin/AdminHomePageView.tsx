"use client";

import { Heading, Stack, VStack } from "@chakra-ui/react";
import { useMemo } from "react";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminNavCards } from "@/components/admin/AdminNavCards";
import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { Auth, hasAuth } from "@/lib/auth";

export function AdminHomePageView() {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const isSuperAdmin = hasAuth(currentUser?.Auth ?? 0, Auth.AuthSuperAdmin);

  const superGroups = useMemo(
    () => [
      {
        title: t("admin.admins.siteManagement"),
        children: [
          {
            title: "网站设置",
            description: "设置网站主页内容、网站图标、网站名等",
            avatar: "⚙️",
            disabled: true,
          },
          {
            title: t("admin.admins.sponsor"),
            description: t("admin.admins.sponsorDesc"),
            to: "/admin/acknowledgments",
            avatar: "❤️",
          },
          {
            title: t("admin.admins.externalLinks"),
            description: t("externalLinks.adminCardDesc"),
            to: "/admin/other-links",
            avatar: "🔗",
          },
          {
            title: "报表",
            description: "网站使用详细报表",
            avatar: "📊",
            disabled: true,
          },
          {
            title: "机器人设置",
            description: "设置机器人权限、群组使用机器人情况",
            avatar: "🤖",
            disabled: true,
          },
          {
            title: "通知管理",
            description: "发布网站通知、修改通知等",
            avatar: "📢",
            disabled: true,
          },
          {
            title: "发言管理",
            description: "处理发言、禁言等",
            avatar: "💬",
            disabled: true,
          },
          {
            title: "话题管理",
            description: "添加和修改话题等",
            avatar: "🏷️",
            disabled: true,
          },
        ],
      },
    ],
    [t],
  );

  const groups = useMemo(
    () => [
      {
        title: "申请列表",
        children: [
          {
            title: "比赛申请",
            description: "审批比赛申请",
            avatar: "📝",
            disabled: true,
          },
          {
            title: "主办申请",
            description: "审批主办团队申请",
            avatar: "✅",
            disabled: true,
          },
        ],
      },
      {
        title: "运动专区",
        children: [
          {
            title: "运动成绩录入",
            description: "录入运动的成绩",
            avatar: "⏱️",
            disabled: true,
          },
          {
            title: "运动项目管理",
            description: "管理运动相关项目",
            avatar: "🏃",
            disabled: true,
          },
        ],
      },
      {
        title: "资源管理",
        children: [
          {
            title: "用户管理",
            description: "管理用户",
            to: "/admin/users",
            avatar: "👥",
          },
          {
            title: "比赛管理",
            description: "比赛列表、详情和修改",
            avatar: "📋",
            disabled: true,
          },
          {
            title: "主办团队管理",
            description: "主办团队管理、详情与修改",
            to: "/admin/manage/organizers",
            avatar: "🏢",
          },
          {
            title: "比赛群组管理",
            description: "比赛群组创建、编辑与删除",
            to: "/admin/manage/groups",
            avatar: "👨‍👩‍👧‍👦",
          },
          {
            title: "项目管理",
            description: "新增和管理对应项目",
            avatar: "📁",
            disabled: true,
          },
          {
            title: "成绩管理",
            description: "管理你的成绩",
            avatar: "🏆",
            disabled: true,
          },
          {
            title: "相册管理",
            description: "管理用户上传的图片",
            avatar: "🖼️",
            disabled: true,
          },
        ],
      },
      {
        title: "自定义 WCA 榜单",
        children: [
          {
            title: "榜单管理",
            description: "自定义 WCA 榜单管理",
            to: "/admin/diy-ranking",
            avatar: "📈",
          },
        ],
      },
    ],
    [],
  );

  return (
    <AdminGuard>
      <VStack align="stretch" gap="6">
        <Stack gap="1">
          <Heading size="xl">{t("nav.admin.admins")}</Heading>
        </Stack>
        {isSuperAdmin ? <AdminNavCards groups={superGroups} /> : null}
        <AdminNavCards groups={groups} />
      </VStack>
    </AdminGuard>
  );
}
