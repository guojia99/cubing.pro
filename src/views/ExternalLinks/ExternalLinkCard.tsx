"use client";
import { useI18n } from "@/contexts/I18nProvider";
import { useAdminManagement } from "@/views/admin/useAdminManagement";

import { Switch } from "@chakra-ui/react";
import { Surface } from "@/components/ui/page";
import type { OtherLink } from "@/services/cubing-pro/public/types";
import { ExternalLinkIconMedia } from "@/views/ExternalLinks/ExternalLinkIconMedia";
import { parseLetterIconKey } from "@/views/ExternalLinks/utils";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

import "./externalLinks.css";

export type ExternalLinkCardAdminProps = {
  onEdit?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  pinned?: boolean;
  onPinChange?: (pinned: boolean) => void;
  pinDisabled?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
};

export type ExternalLinkCardProps = {
  link: OtherLink;
  className?: string;
  admin?: ExternalLinkCardAdminProps;
  descMaxChars?: number;
};

export function ExternalLinkCard({
  link,
  className,
  admin,
  descMaxChars,
}: ExternalLinkCardProps) {
  const { t } = useI18n();
  const m = useAdminManagement();
  const descDisplay = (() => {
    const raw = (link.desc ?? "").trim();
    if (descMaxChars !== undefined) {
      const t = raw.length > descMaxChars ? `${raw.slice(0, descMaxChars)}…` : raw;
      return { text: t || " ", fullClass: true as const };
    }
    return { text: link.desc || " ", fullClass: false as const };
  })();

  const iconBlock = (
    <div
      className={cx(
        "external-link-card__iconWrap",
        !!parseLetterIconKey(link.icon) && "external-link-card__iconWrap--letter",
      )}
    >
      <ExternalLinkIconMedia link={link} />
    </div>
  );

  const textBlock = (
    <div className="external-link-card__text">
      {admin ? (
        <a
          href={link.url || "#"}
          className="external-link-card__titleLink"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (!link.url?.trim()) e.preventDefault();
          }}
        >
          <div className="external-link-card__title">{link.name || t("competitionAdmin.unnamed")}</div>
        </a>
      ) : (
        <div className="external-link-card__title">{link.name || t("competitionAdmin.unnamed")}</div>
      )}
      <div
        className={cx(
          "external-link-card__desc",
          descDisplay.fullClass && "external-link-card__desc--full",
        )}
        title={descMaxChars !== undefined ? (link.desc ?? "").trim() : link.desc}
      >
        {descDisplay.text}
      </div>
    </div>
  );

  const mainRow = (
    <div className="external-link-card__row">
      {admin?.dragHandleProps && (
        <span className="external-link-card__drag" {...admin.dragHandleProps} title={t("admin.acknowledgments.dragRow")}>
          ⋮⋮
        </span>
      )}
      {iconBlock}
      {textBlock}
    </div>
  );

  const toolbar =
    admin &&
    (typeof admin.onPinChange === "function" ||
      admin.onEdit ||
      admin.onDelete ||
      admin.onMove) && (
      <div className="external-link-card__toolbar">
        {typeof admin.onPinChange === "function" && (
          <span className="external-link-card__pin">
            <span>{m("adminManagement.pinHome")}</span>
            <Switch.Root
              size="sm"
              checked={admin.pinned}
              aria-label={m("adminManagement.pinHome")}
              disabled={admin.pinDisabled && !admin.pinned}
              onCheckedChange={(e) => admin.onPinChange?.(e.checked)}
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </span>
        )}
        <span className="external-link-card__actions">
          {admin.onMove && (
            <button
              type="button"
              className="external-link-card__actionBtn"
              onClick={() => admin.onMove?.()}
            >
              {m("adminManagement.move")}
            </button>
          )}
          {admin.onEdit && (
            <button
              type="button"
              className="external-link-card__actionBtn"
              onClick={() => admin.onEdit?.()}
            >
              {t("teamMatch.edit")}
            </button>
          )}
          {admin.onDelete && (
            <button
              type="button"
              className="external-link-card__actionBtn"
              onClick={() => admin.onDelete?.()}
            >
              {t("teamMatch.delete")}
            </button>
          )}
        </span>
      </div>
    );

  if (admin) {
    return (
      <Surface p="0" className={cx("external-link-card", "external-link-card--admin", className)}>
        <div className="external-link-card__body">
          <div className="external-link-card__main">
            <div className="external-link-card__openHint">{m("adminManagement.openLinkHint")}</div>
            {mainRow}
          </div>
          {toolbar}
        </div>
      </Surface>
    );
  }

  return (
    <Surface p="0" className={cx("external-link-card", className)}>
      <a
        href={link.url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="external-link-card__link"
        onClick={(e) => {
          if (!link.url?.trim()) e.preventDefault();
        }}
      >
        <div className="external-link-card__body">
          <div className="external-link-card__main">{mainRow}</div>
        </div>
      </a>
    </Surface>
  );
}
