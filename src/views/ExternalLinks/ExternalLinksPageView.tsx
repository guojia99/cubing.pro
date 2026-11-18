"use client";

import { EmptyState, Input, Spinner, VStack } from "@chakra-ui/react";
import { PageHeader, SectionHeader, Surface } from "@/components/ui/page";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";
import { emptyOtherLinks } from "@/services/cubing-pro/otherLinksNormalize";
import { getOtherLinks } from "@/services/cubing-pro/public/orgs";
import type { OtherLinks } from "@/services/cubing-pro/public/types";
import { ExternalLinkCard } from "@/views/ExternalLinks/ExternalLinkCard";
import {
  buildGroupSections,
  filterGroupSectionsByQuery,
} from "@/views/ExternalLinks/utils";

import "./externalLinks.css";

export const EXTERNAL_LINKS_LIST_DESC_MAX = 128;

export function ExternalLinksGroupedView({
  data,
  searchQuery = "",
}: {
  data: OtherLinks;
  searchQuery?: string;
}) {
  const { t } = useI18n();
  const sections = useMemo(() => {
    const raw = buildGroupSections(data, false);
    return filterGroupSectionsByQuery(raw, searchQuery);
  }, [data, searchQuery]);

  if (sections.length === 0) {
    if (searchQuery.trim()) {
      return (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Title>{t("externalLinks.searchEmpty")}</EmptyState.Title>
          </EmptyState.Content>
        </EmptyState.Root>
      );
    }
    return null;
  }

  return (
    <div className="external-links-page">
      {sections.map((s) => (
        <section key={s.title} className="external-links-group">
          <Surface p={{ base: "3", md: "5" }}>
            <SectionHeader title={s.title} />
            <div className="external-links-grid external-links-grid--max4">
              {s.links.map((l) => (
                <ExternalLinkCard key={l.key} link={l} descMaxChars={EXTERNAL_LINKS_LIST_DESC_MAX} />
              ))}
            </div>
          </Surface>
        </section>
      ))}
    </div>
  );
}

export function ExternalLinksPageView() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<OtherLinks | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getOtherLinks();
      setData(d ?? emptyOtherLinks());
    } catch {
      setData(emptyOtherLinks());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const empty = data !== null && buildGroupSections(data, false).length === 0;

  return (
    <VStack align="stretch" gap="5" maxW="var(--page-max)" w="full" mx="auto">
      <PageHeader eyebrow={getSiteContent(locale)("siteContent.aroundCommunity")} title={t("externalLinks.title")} description={t("externalLinks.subtitle")} />

      {loading ? (
        <Spinner size="lg" color="brand.solid" alignSelf="center" />
      ) : empty ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Title>{t("externalLinks.empty")}</EmptyState.Title>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        data && (
          <div className="external-links-page-wrap">
            <Input
              className="external-links-page__search"
              placeholder={t("externalLinks.searchPlaceholder")}
              aria-label={t("externalLinks.searchPlaceholder")}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <ExternalLinksGroupedView data={data} searchQuery={search} />
          </div>
        )
      )}
    </VStack>
  );
}
