"use client";

import { EmptyState, Heading, Input, Spinner, Stack, Text, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
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
          <div className="external-links-group-shell">
            <Heading as="h2" size="md" className="external-links-groupTitle" mb="3">
              {s.title}
            </Heading>
            <div className="external-links-grid external-links-grid--max4">
              {s.links.map((l) => (
                <ExternalLinkCard key={l.key} link={l} descMaxChars={EXTERNAL_LINKS_LIST_DESC_MAX} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

export function ExternalLinksPageView() {
  const { t } = useI18n();
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
    <VStack align="stretch" gap="6">
      <Stack gap="1">
        <Heading size="xl">{t("externalLinks.title")}</Heading>
        <Text color="fg.muted">{t("externalLinks.subtitle")}</Text>
      </Stack>

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
