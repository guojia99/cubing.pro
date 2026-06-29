"use client";

import { Card, Link, Spinner, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { emptyOtherLinks } from "@/services/cubing-pro/otherLinksNormalize";
import { getOtherLinks } from "@/services/cubing-pro/public/orgs";
import type { OtherLinks } from "@/services/cubing-pro/public/types";
import { ExternalLinkCard } from "@/views/ExternalLinks/ExternalLinkCard";
import { getTopLinks } from "@/views/ExternalLinks/utils";

import "./externalLinks.css";

export function ExternalLinksHomeSection() {
  const { t } = useI18n();
  const [data, setData] = useState<OtherLinks | null>(null);
  const [loading, setLoading] = useState(true);

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

  const tops = data ? getTopLinks(data) : [];
  const hasLinks = data ? (data.links?.length ?? 0) > 0 : false;

  if (!loading && !hasLinks) {
    return null;
  }

  return (
    <Card.Root mb="6" borderRadius="xl">
      <Card.Body p="5">
        <div className="external-links-home">
          <div className="external-links-home__head">
            <div className="external-links-home__title">{t("externalLinks.homeSectionTitle")}</div>
            <Link asChild fontSize="sm" color="accent">
              <NextLink href="/external-links">{t("externalLinks.viewAll")}</NextLink>
            </Link>
          </div>
          {loading ? (
            <Spinner size="md" color="brand.solid" />
          ) : tops.length > 0 ? (
            <div className="external-links-home__grid">
              {tops.map((l) => (
                <ExternalLinkCard key={l.key} link={l} />
              ))}
            </div>
          ) : (
            <Text fontSize="sm" color="fg.muted">
              {t("externalLinks.homeTip")}
            </Text>
          )}
        </div>
      </Card.Body>
    </Card.Root>
  );
}
