"use client";

import { Box, Button, Flex } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { FiPause, FiPlay } from "react-icons/fi";

import { SectionHeader, Surface } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";
import { getAdList } from "@/views/Advertisement/config";
import "./welcome.css";

const adList = getAdList();

export function AdvertisementCarousel() {
  const { locale } = useI18n();
  const sc = getSiteContent(locale);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (adList.length < 2 || paused || interacting || reducedMotion) return;
    const timer = setTimeout(() => {
      setCurrent((value) => (value + 1) % adList.length);
    }, (adList[current]?.duration ?? 10) * 1000);
    return () => clearTimeout(timer);
  }, [current, paused, interacting, reducedMotion]);

  if (adList.length === 0) return null;
  const Thumbnail = adList[current].Thumbnail;

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
        <div className="welcome-ad-content" role="group" aria-label={`${current + 1} / ${adList.length}`} aria-live={paused || reducedMotion ? "polite" : "off"}><Thumbnail /></div>
        <div className="welcome-ad-controls">
          <div className="welcome-ad-dots">
            {adList.map((ad, index) => (
              <button key={ad.key} type="button" className="welcome-ad-dot" aria-label={sc("siteContent.slide", { count: index + 1 })} aria-current={index === current ? "true" : undefined} onClick={() => { setCurrent(index); setPaused(true); }}>
                {String(index + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
          <Flex gap="2" wrap="wrap" justify="flex-end">
            <Button asChild variant="ghost" size="xs"><NextLink href={`/advertisement?key=${adList[current].key}`}>{sc("siteContent.details")}</NextLink></Button>
            {!reducedMotion && adList.length > 1 ? <Button variant="outline" size="xs" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? <FiPlay /> : <FiPause />}{sc(paused ? "siteContent.play" : "siteContent.pause")}</Button> : null}
          </Flex>
        </div>
      </Box>
    </Surface>
  );
}
