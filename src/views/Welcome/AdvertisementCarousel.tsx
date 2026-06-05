"use client";

import { useEffect, useState } from "react";

import { getAdList } from "@/views/Advertisement/config";
import "@/views/ExternalLinks/externalLinks.css";

const CAROUSEL_HEIGHT = 450;

export function AdvertisementCarousel() {
  const adList = getAdList();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (adList.length === 0 || paused) return;

    const duration = adList[current]?.duration ?? 10;
    const timer = setTimeout(() => {
      setCurrent((c) => (c + 1) % adList.length);
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [current, adList, paused]);

  if (adList.length === 0) return null;

  return (
    <div
      className="ad-carousel-wrapper"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={{ height: CAROUSEL_HEIGHT }} className="ad-carousel-container">
        <div
          className="ad-carousel-track"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {adList.map((ad) => {
            const Thumbnail = ad.Thumbnail;
            return (
              <div key={ad.key} className="ad-carousel-slide">
                <div className="ad-carousel-thumbnail-wrap">
                  <Thumbnail />
                </div>
              </div>
            );
          })}
        </div>
        <div className="ad-carousel-dots">
          {adList.map((ad, i) => (
            <button
              key={ad.key}
              type="button"
              className={`ad-carousel-dot${i === current ? " ad-carousel-dot--active" : ""}`}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
