"use client";
import { type ReactNode, useState } from "react";
import { Button } from "@chakra-ui/react";
import { useI18n } from "@/contexts/I18nProvider";
import type { CardTemplate } from "@/services/cubing-pro/cubeCards";
import styles from "./CardArtwork.module.css";
type CardArtworkProps = { template: CardTemplate; alt: string } & (
  | { src: string; children?: never }
  | { src?: never; children: ReactNode }
);

export function CardArtwork({ src, children, template, alt }: CardArtworkProps) {
  const [paused, setPaused] = useState(false);
  const { t } = useI18n();
  return <div className={styles.stage} data-template={template}>
    <div className={`${styles.artwork} ${template === "motion" ? styles.motion : ""} ${paused ? styles.paused : ""}`} data-testid="card-artwork">
      {/* Bounded local PNG or authenticated blob; no image optimization request. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src !== undefined ? <img src={src} alt={alt} width={1080} height={template === "motion" ? 1440 : 1080} /> : children}
    </div>
    {template === "motion" && <Button className={styles.controls} mt="4" size="sm" variant="outline" aria-pressed={paused} onClick={() => setPaused(!paused)}>{t(paused ? "playerCard.play" : "playerCard.pause")}</Button>}
  </div>;
}
