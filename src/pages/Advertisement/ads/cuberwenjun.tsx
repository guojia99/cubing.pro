import { Link } from '@@/exports';
import { Card, Image } from 'antd';
import React from 'react';
import contentData from './cuberwenjun.json';

const THUMBNAIL_IMG = (contentData as { src: string; caption: string }[])[0]?.src || '/advertisement/cuberwenjun/价目表.jpg';

/** 淡橙色配色 */
const ORANGE_PALETTE = {
  bgLight: '#fff8f3',
  bgMid: '#ffefe6',
  bgAccent: '#ffdfd0',
  border: 'rgba(255, 152, 99, 0.35)',
  text: '#8b5a2b',
  textLight: '#b87333',
};

/** 缩略图：占满 100%，左右平均分布，左边图片，右边 slogan + 联系方式，淡橙色设计 */
export const CuberwenjunThumbnail: React.FC = () => {
  return (
    <Link
      to="/advertisement?key=cuberwenjun"
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        height: '100%',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          background: ORANGE_PALETTE.bgLight,
          borderRadius: 6,
        }}
      >
        {/* 左侧 50%：主图 */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: ORANGE_PALETTE.bgMid,
            position: 'relative',
          }}
        >
          <img
            src={THUMBNAIL_IMG}
            alt="俊改魔方"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
              display: 'block',
            }}
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              if (el.parentElement) {
                el.parentElement.style.background = `linear-gradient(135deg, ${ORANGE_PALETTE.bgMid} 0%, ${ORANGE_PALETTE.bgAccent} 100%)`;
              }
            }}
          />
        </div>
        {/* 右侧 50%：品牌与联系方式 */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            // padding: 24,
            background: `linear-gradient(180deg, ${ORANGE_PALETTE.bgLight} 0%, ${ORANGE_PALETTE.bgMid} 100%)`,
            borderLeft: `1px solid ${ORANGE_PALETTE.border}`,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: ORANGE_PALETTE.text,
              marginBottom: 8,
              letterSpacing: '0.05em',
            }}
          >
            俊改魔方
          </div>
          <div
            style={{
              fontSize: 13,
              color: ORANGE_PALETTE.textLight,
              marginBottom: 16,
            }}
          >
            专业魔方改装
          </div>
          <div
            style={{
              fontSize: 14,
              color: ORANGE_PALETTE.text,
              padding: '10px 18px',
              borderRadius: 8,
              background: ORANGE_PALETTE.bgAccent,
              border: `1px solid ${ORANGE_PALETTE.border}`,
            }}
          >
            微信 / 闲鱼：Cuberwenjun
          </div>
        </div>
      </div>
    </Link>
  );
};

/** 详情页：大标题 + 微信联系方式 + 多张图片，淡橙色设计 */
export const CuberwenjunFullContent: React.FC = () => {
  const items = contentData as { src: string; caption: string }[];

  return (
    <Card
      style={{
        borderRadius: 8,
        marginBottom: 24,
        background: ORANGE_PALETTE.bgLight,
        borderColor: ORANGE_PALETTE.border,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
        {/* 大标题 */}
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: ORANGE_PALETTE.text,
            margin: 0,
            textAlign: 'center',
          }}
        >
          俊改魔方 - 专业魔方改装服务
        </h1>

        {/* 微信联系方式，放在最前面 */}
        <div
          style={{
            fontSize: 16,
            color: ORANGE_PALETTE.textLight,
            textAlign: 'center',
            padding: '12px 20px',
            borderRadius: 8,
            background: ORANGE_PALETTE.bgAccent,
            border: `1px solid ${ORANGE_PALETTE.border}`,
          }}
        >
          微信 / 闲鱼：<strong style={{ color: ORANGE_PALETTE.text }}>Cuberwenjun</strong>
        </div>

        {/* 图片列表 */}
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 600 }}>
            <Image
              src={item.src}
              alt={item.caption}
              style={{ width: '100%', maxWidth: 600, borderRadius: 8, display: 'block' }}
              fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3Ctext fill='%23999' x='50%' y='50%' font-size='16' text-anchor='middle' dy='.3em'%3E图片%3C/text%3E%3C/svg%3E"
            />
            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                color: ORANGE_PALETTE.textLight,
                textAlign: 'center',
              }}
            >
              {item.caption}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
