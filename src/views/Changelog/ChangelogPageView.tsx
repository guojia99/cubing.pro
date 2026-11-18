"use client";

import {
  Badge,
  Box,
  Button,
  Flex,
  SegmentGroup,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { BiCalendar } from "react-icons/bi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";
import { PageHeader, Surface } from "@/components/ui/page";
import {
  formatChangelogDate,
  getChangelogLoadError,
  loadChangelog,
  type ChangelogEntry,
} from "@/views/Changelog/parseChangelog";

import "./changelog.css";

type ScopeFilter = "all" | "frontend" | "backend";

function ChangelogItemRow({
  scope,
  text,
}: {
  scope: "frontend" | "backend";
  text: string;
}) {
  const { t } = useI18n();
  const scopeLabel =
    scope === "frontend" ? t("changelog.frontend") : t("changelog.backend");
  const colorPalette = scope === "frontend" ? "blue" : "green";

  return (
    <Flex align="flex-start" gap="2.5" py="1.5">
      <Badge
        colorPalette={colorPalette}
        variant="subtle"
        flexShrink={0}
        mt="0.5"
        fontSize="xs"
      >
        {scopeLabel}
      </Badge>
      <Box
        flex="1"
        color="fg"
        fontSize="sm"
        lineHeight="1.6"
        className="changelog-item-markdown"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <span>{children}</span>,
          }}
        >
          {text}
        </ReactMarkdown>
      </Box>
    </Flex>
  );
}

function ChangelogEntryCard({
  entry,
  scopeFilter,
}: {
  entry: ChangelogEntry;
  scopeFilter: ScopeFilter;
}) {
  const { tf, locale } = useI18n();
  const frontendItems = entry.items.filter((i) => i.scope === "frontend");
  const backendItems = entry.items.filter((i) => i.scope === "backend");

  return (
    <Surface as="article" p="0" overflow="hidden" borderLeftWidth="3px" borderLeftColor="accent">
      <Box
        py="3.5"
        px="5"
        borderBottomWidth="1px"
        borderColor="border"
      >
        <Flex align="center" gap="3" flexWrap="wrap">
          <Flex align="center" gap="2" color="fg.muted">
            <Box as={BiCalendar} boxSize="4" aria-hidden />
            <Text fontSize="md" fontWeight="semibold" color="fg">
              {formatChangelogDate(entry.date, locale)}
            </Text>
          </Flex>
          <Text fontSize="sm" color="fg.muted">
            {entry.date}
          </Text>
          {scopeFilter === "all" ? (
            <Flex gap="2" ml="auto" flexWrap="wrap">
              {frontendItems.length > 0 ? (
                <Badge colorPalette="blue" variant="subtle" borderRadius="full">
                  {tf("changelog.frontendCount", { count: frontendItems.length })}
                </Badge>
              ) : null}
              {backendItems.length > 0 ? (
                <Badge colorPalette="green" variant="subtle" borderRadius="full">
                  {tf("changelog.backendCount", { count: backendItems.length })}
                </Badge>
              ) : null}
            </Flex>
          ) : null}
        </Flex>
      </Box>
      <Box py="3" px={{ base: "3", md: "5" }}>
        <Stack gap="1">
          {entry.items.map((item, idx) => (
            <ChangelogItemRow key={`${entry.date}-${idx}`} scope={item.scope} text={item.text} />
          ))}
        </Stack>
      </Box>
    </Surface>
  );
}

export function ChangelogPageView() {
  const { t, locale } = useI18n();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedLocale, setLoadedLocale] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setEntries([]);
    setLoadFailed(false);
    loadChangelog(locale, controller.signal)
      .then((nextEntries) => {
        if (controller.signal.aborted) return;
        setEntries(nextEntries);
        setLoadedLocale(locale);
        setLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setLoadFailed(true);
        setLoadedLocale(locale);
        setLoading(false);
      });
    return () => controller.abort();
  }, [locale]);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      if (!e.isYear) set.add(e.date.slice(0, 4));
    }
    return Array.from(set).sort().reverse();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter((e) => !e.isYear)
      .filter((e) => yearFilter === "all" || e.date.startsWith(yearFilter))
      .map((e) => ({
        ...e,
        items:
          scopeFilter === "all"
            ? e.items
            : e.items.filter((i) => i.scope === scopeFilter),
      }))
      .filter((e) => e.items.length > 0);
  }, [entries, scopeFilter, yearFilter]);

  const scopeOptions: { key: ScopeFilter; label: string }[] = [
    { key: "all", label: t("changelog.all") },
    { key: "frontend", label: t("changelog.frontend") },
    { key: "backend", label: t("changelog.backend") },
  ];

  return (
    <Stack align="stretch" gap="5" maxW="var(--page-max)" mx="auto" w="full">
      <PageHeader eyebrow={getSiteContent(locale)("siteContent.releaseNotes")} title={t("nav.more.changelog")} />

      <Surface p={{ base: "3", md: "4" }}><Flex
        align={{ base: "stretch", md: "center" }}
        gap="4"
        flexWrap="wrap"
        flexDirection={{ base: "column", md: "row" }}
      >
        <Box maxW="full" minW="0"><SegmentGroup.Root
           display="flex"
           flexWrap="wrap"
           maxW="full"
           minW="0"
          value={yearFilter}
          onValueChange={(e) => setYearFilter(e.value ?? "all")}
           size="sm"
           aria-label={t("changelog.allYears")}
        >
          <SegmentGroup.Indicator />
          <SegmentGroup.Item value="all">
            <SegmentGroup.ItemText>{t("changelog.allYears")}</SegmentGroup.ItemText>
            <SegmentGroup.ItemHiddenInput />
          </SegmentGroup.Item>
          {years.map((year) => (
            <SegmentGroup.Item key={year} value={year}>
              <SegmentGroup.ItemText>{year}</SegmentGroup.ItemText>
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
          ))}
        </SegmentGroup.Root></Box>

        <Flex gap="2" ml={{ md: "auto" }} flexWrap="wrap">
          {scopeOptions.map(({ key, label }) => (
            <Button
              key={key}
              size="xs"
              borderRadius="full"
              variant={scopeFilter === key ? "solid" : "outline"}
              colorPalette={scopeFilter === key ? "brand" : "gray"}
              onClick={() => setScopeFilter(key)}
              aria-pressed={scopeFilter === key}
            >
              {label}
            </Button>
          ))}
        </Flex>
      </Flex></Surface>

      {loading || loadedLocale !== locale ? (
        <Flex justify="center" py="20">
          <Spinner size="lg" />
        </Flex>
      ) : loadFailed ? (
        <Text role="alert">{getChangelogLoadError(locale)}</Text>
      ) : (
        <Stack gap="4">
          {filteredEntries.map((entry) => (
            <ChangelogEntryCard
              key={entry.date}
              entry={entry}
              scopeFilter={scopeFilter}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
