"use client";

import { Box, Button, Flex } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { FiPause, FiPlay } from "react-icons/fi";

import { SectionHeader, Surface } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";
import { getAdList } from "@/views/Advertisement/config";
import { ManagedAdThumbnail } from "@/views/Advertisement/ManagedAdvertisement";
import { useAdvertisements } from "@/views/Advertisement/useAdvertisements";
import type { Advertisement } from "@/services/cubing-pro/advertisements";
import "./welcome.css";

export function AdvertisementCarousel() {
  const { locale } = useI18n();
  const sc = getSiteContent(locale);
  const { items } = useAdvertisements();
  const builtins = getAdList();
  const adList = [...builtins.filter(ad => !ad.builtin), ...items.map(ad => ({ key: ad.key, duration: ad.duration, managed: ad })), ...builtins.filter(ad => ad.builtin)];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const count = adList.length;
  const duration = adList[current % count]?.duration ?? 10;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (count < 2 || paused || interacting || reducedMotion) return;
    const timer = setTimeout(() => {
      setCurrent((value) => (value + 1) % count);
    }, duration * 1000);
    return () => clearTimeout(timer);
  }, [current, paused, interacting, reducedMotion, count, duration]);

  if (adList.length === 0) return null;
  const index = current % adList.length;
  const activeAd = adList[index];
  const managed = "managed" in activeAd ? activeAd.managed as Advertisement : undefined;
  const Thumbnail = "Thumbnail" in activeAd ? activeAd.Thumbnail : undefined;

  return (
    <Surface as="section" p={{ base: "3", md: "5" }}>
      <SectionHeader eyebrow={sc("siteContent.partners")} title={sc("siteContent.community")} />
      <Box
        className="welcome-ad-stage"
        role="region"
        aria-roledescription={sc("siteContent.carousel")}
        aria-label={sc("siteContent.community")}
        onMouseEnter={() => setInteracting(true)}
        onMouseLeave={() => setInteracting(false)}
        onFocusCapture={() => setInteracting(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInteracting(false);
        }}
        mt="3"
      >
        <div className="welcome-ad-content" role="group" aria-label={`${index + 1} / ${adList.length}`} aria-live={paused || reducedMotion ? "polite" : "off"}>{managed ? <ManagedAdThumbnail ad={managed} /> : Thumbnail ? <Thumbnail /> : null}</div>
        <div className="welcome-ad-controls">
          <div className="welcome-ad-dots">
            {adList.map((ad, index) => (
              <button key={ad.key} type="button" className="welcome-ad-dot" aria-label={sc("siteContent.slide", { count: index + 1 })} aria-current={ad.key === activeAd.key ? "true" : undefined} onClick={() => { setCurrent(index); setPaused(true); }}>
                {String(index + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
          <Flex gap="2" wrap="wrap" justify="flex-end">
            <Button asChild variant="ghost" size="xs"><NextLink href={`/advertisement?key=${encodeURIComponent(activeAd.key)}`}>{sc("siteContent.details")}</NextLink></Button>
            {!reducedMotion && adList.length > 1 ? <Button variant="outline" size="xs" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? <FiPlay /> : <FiPause />}{sc(paused ? "siteContent.play" : "siteContent.pause")}</Button> : null}
          </Flex>
        </div>
      </Box>
    </Surface>
  );
}
