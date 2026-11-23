"use client";
import { useAdminManagement } from "@/views/admin/useAdminManagement";

import { VStack } from "@chakra-ui/react";
import { PageHeader } from "@/components/ui/page";
import "./admin-ui.css";
import { useMemo } from "react";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminNavigation } from "./AdminNavigation";
import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { Auth, hasAuth } from "@/lib/auth";

export function AdminHomePageView() {
  const m = useAdminManagement();
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const isSuperAdmin = hasAuth(currentUser?.Auth ?? 0, Auth.AuthSuperAdmin);

  const superGroups = useMemo(
    () => [
      {
        title: t("admin.admins.siteManagement"),
        children: [
          {
            title: m("adminManagement.siteSettings"),
            description: m("adminManagement.siteSettingsDesc"),
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
            title: t("advertisements.adminTitle"),
            description: t("advertisements.adminDescription"),
            to: "/admin/advertisements",
            avatar: "🖼️",
          },
          {
            title: t("admin.admins.externalLinks"),
            description: t("externalLinks.adminCardDesc"),
            to: "/admin/other-links",
            avatar: "🔗",
          },
          {
            title: m("adminManagement.reports"),
            description: m("adminManagement.reportsDesc"),
            avatar: "📊",
            disabled: true,
          },
          {
            title: m("adminManagement.botSettings"),
            description: m("adminManagement.botSettingsDesc"),
            avatar: "🤖",
            disabled: true,
          },
          {
            title: t("siteAnnouncement.title"),
            description: t("siteAnnouncement.adminHint"),
            avatar: "📢",
            to: "/admin/site-announcement",
          },
          {
            title: m("adminManagement.comments"),
            description: m("adminManagement.commentsDesc"),
            avatar: "💬",
            disabled: true,
          },
          {
            title: m("adminManagement.topics"),
            description: m("adminManagement.topicsDesc"),
            avatar: "🏷️",
            disabled: true,
          },
        ],
      },
    ],
    [t, m],
  );

  const groups = useMemo(
    () => [
      {
        title: m("adminManagement.applications"),
        children: [
          {
            title: m("adminManagement.competitionReview"),
            description: m("adminManagement.competitionReviewDesc"),
            avatar: "📝",
            to: "/admin/competition/approvals",
          },
          {
            title: m("adminManagement.organizerApplications"),
            description: m("adminManagement.organizerApplicationsDesc"),
            avatar: "✅",
            disabled: true,
          },
        ],
      },
      {
        title: m("adminManagement.sports"),
        children: [
          {
            title: m("adminManagement.sportsEntry"),
            description: m("adminManagement.sportsEntryDesc"),
            avatar: "⏱️",
            disabled: true,
          },
          {
            title: m("adminManagement.sportsEvents"),
            description: m("adminManagement.sportsEventsDesc"),
            avatar: "🏃",
            disabled: true,
          },
        ],
      },
      {
        title: m("adminManagement.resources"),
        children: [
          {
            title: m("adminManagement.usersTitle"),
            description: m("adminManagement.usersDesc"),
            to: "/admin/users",
            avatar: "👥",
          },
          {
            title: t("competitionAdmin.competitionManagement"),
            description: m("adminManagement.competitionsDesc"),
            avatar: "📋",
            to: "/admin/competition/approvals?status=all",
          },
          {
            title: m("adminManagement.organizersTitle"),
            description: m("adminManagement.organizersDesc"),
            to: "/admin/manage/organizers",
            avatar: "🏢",
          },
          {
            title: m("adminManagement.groupsTitle"),
            description: m("adminManagement.groupsDesc"),
            to: "/admin/manage/groups",
            avatar: "👨‍👩‍👧‍👦",
          },
          {
            title: m("adminManagement.events"),
            description: m("adminManagement.eventsDesc"),
            avatar: "📁",
            disabled: true,
          },
          {
            title: m("adminManagement.results"),
            description: m("adminManagement.resultsDesc"),
            avatar: "🏆",
            disabled: true,
          },
          {
            title: m("adminManagement.albums"),
            description: m("adminManagement.albumsDesc"),
            avatar: "🖼️",
            disabled: true,
          },
        ],
      },
      {
        title: m("adminManagement.customWcaRankings"),
        children: [
          {
            title: m("adminManagement.rankingManagement"),
            description: m("adminManagement.rankingDesc"),
            to: "/admin/diy-ranking",
            avatar: "📈",
          },
        ],
      },
    ],
    [t, m],
  );

  return (
    <AdminGuard>
      <VStack className="admin-page" align="stretch" gap="6">
        <PageHeader eyebrow={t("admin.admins.siteManagement")} title={t("nav.admin.admins")} />
        {isSuperAdmin ? <AdminNavigation groups={superGroups} /> : null}
        <AdminNavigation groups={groups} />
      </VStack>
    </AdminGuard>
  );
}
