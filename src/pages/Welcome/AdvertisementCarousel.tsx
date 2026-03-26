import { Card, Carousel } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { getAdList } from '@/pages/Advertisement/config';
import './AdvertisementCarousel.less';

const CAROUSEL_HEIGHT = 450;
const SLIDE_PADDING = 16;

/** 广告轮播：每张不同时长，最后一张 3 秒，其他 10 秒；鼠标悬停时暂停 */
const AdvertisementCarousel: React.FC = () => {
  const adList = getAdList();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const carouselRef = useRef<any>(null);

  useEffect(() => {
    if (adList.length === 0 || paused) return;

    const duration = adList[current]?.duration ?? 10;
    const timer = setTimeout(() => {
      const next = (current + 1) % adList.length;
      setCurrent(next);
      carouselRef.current?.next();
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
        <Carousel
          ref={carouselRef}
          dots={{ className: 'ad-carousel-dots' }}
          afterChange={setCurrent}
          autoplay={false}
          style={{ height: '100%' }}
        >
          {adList.map((ad) => {
            const Thumbnail = ad.Thumbnail;
            return (
              <div
                key={ad.key}
                className="ad-carousel-slide"
                style={{
                  height: CAROUSEL_HEIGHT,
                  padding: SLIDE_PADDING,
                  boxSizing: 'border-box',
                }}
              >
                <div
                  className="ad-carousel-thumbnail-wrap"
                  style={{
                    height: CAROUSEL_HEIGHT - SLIDE_PADDING * 2,
                    width: '100%',
                    overflow: 'hidden',
                    borderRadius: 6,
                  }}
                >
                  <Thumbnail />
                </div>
              </div>
            );
          })}
        </Carousel>
      </div>
    </div>

    // </Card>
  );
};

export default AdvertisementCarousel;
