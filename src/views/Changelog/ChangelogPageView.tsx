"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
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
import {
  formatChangelogDate,
  parseChangelog,
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
  const { t, tf } = useI18n();
  const frontendItems = entry.items.filter((i) => i.scope === "frontend");
  const backendItems = entry.items.filter((i) => i.scope === "backend");

  return (
    <Card.Root borderRadius="lg" overflow="hidden">
      <Card.Header
        py="3.5"
        px="5"
        borderBottomWidth="1px"
        borderColor="border"
      >
        <Flex align="center" gap="3" flexWrap="wrap">
          <Flex align="center" gap="2" color="fg.muted">
            <Box as={BiCalendar} boxSize="4" aria-hidden />
            <Text fontSize="md" fontWeight="semibold" color="fg">
              {formatChangelogDate(entry.date)}
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
      </Card.Header>
      <Card.Body py="3" px="5">
        <Stack gap="1">
          {entry.items.map((item, idx) => (
            <ChangelogItemRow key={`${entry.date}-${idx}`} scope={item.scope} text={item.text} />
          ))}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}

export function ChangelogPageView() {
  const { t } = useI18n();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/CHANGELOG.md")
      .then((r) => r.text())
      .then((md) => {
        setEntries(parseChangelog(md));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
    <Stack align="stretch" gap="6">
      <Heading size="lg">{t("nav.more.changelog")}</Heading>

      <Flex
        align={{ base: "stretch", md: "center" }}
        gap="4"
        flexWrap="wrap"
        flexDirection={{ base: "column", md: "row" }}
      >
        <SegmentGroup.Root
          value={yearFilter}
          onValueChange={(e) => setYearFilter(e.value ?? "all")}
          size="sm"
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
        </SegmentGroup.Root>

        <Flex gap="2" ml={{ md: "auto" }} flexWrap="wrap">
          {scopeOptions.map(({ key, label }) => (
            <Button
              key={key}
              size="xs"
              borderRadius="full"
              variant={scopeFilter === key ? "solid" : "outline"}
              colorPalette={scopeFilter === key ? "brand" : "gray"}
              onClick={() => setScopeFilter(key)}
            >
              {label}
            </Button>
          ))}
        </Flex>
      </Flex>

      {loading ? (
        <Flex justify="center" py="20">
          <Spinner size="lg" />
        </Flex>
      ) : (
        <Stack gap="5">
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
