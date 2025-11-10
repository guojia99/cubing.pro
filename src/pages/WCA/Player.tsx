import React, { useEffect, useState } from 'react';
import { useParams } from '@@/exports';
import { getWCAPersonCompetitions, getWCAPersonProfile, getWCAPersonResults } from '@/services/wca/player';
import { Spin } from 'antd';
import WCAPlayerDetails from '@/pages/WCA/PlayerComponents/PlayerDetails';
import WCAPlayerResultTable from '@/pages/WCA/PlayerComponents/PlayerResultTable';
import WCAPlayerStaticsTab from '@/pages/WCA/PlayerComponents/WCAPlayerStaticsTab';
import { WCACompetition, WcaProfile, WCAResult } from '@/services/wca/types';

interface CachedData {
  wcaProfile: WcaProfile;
  wcaResults: WCAResult[];
  comps: WCACompetition[];
  timestamp: number;
}

const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6小时 (毫秒)

const WCAPlayer: React.FC = () => {
  const { wcaId } = useParams();
  const [is404, setIs404] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [wcaProfile, setWcaProfile] = useState<WcaProfile>();
  const [wcaResults, setWcaResults] = useState<WCAResult[]>([]);
  const [comps, setComps] = useState<WCACompetition[]>([]);

  // 自动清理过期缓存的函数
  const cleanupExpiredCache = () => {
    if (typeof window === 'undefined') return;

    const now = Date.now();
    const keysToRemove: string[] = [];

    // 遍历所有localStorage项，查找WCA相关的缓存
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('wca_player_data_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item) as CachedData;
            // 检查是否过期
            if (now - parsed.timestamp > CACHE_DURATION) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // 如果解析失败，也删除该项
          keysToRemove.push(key);
        }
      }
    }

    // 删除过期的缓存项
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed expired cache: ${key}`);
    });

    if (keysToRemove.length > 0) {
      console.log(`Cleaned up ${keysToRemove.length} expired cache entries`);
    }
  };

  const getCacheKey = (id: string) => `wca_player_data_${id}`;

  const getFromCache = (id: string): CachedData | null => {
    if (typeof window === 'undefined') return null;

    const cacheKey = getCacheKey(id);
    const cachedData = localStorage.getItem(cacheKey);

    if (!cachedData) return null;

    try {
      const parsed = JSON.parse(cachedData) as CachedData;
      const now = Date.now();

      // 检查缓存是否过期
      if (now - parsed.timestamp > CACHE_DURATION) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error parsing cached data:', error);
      localStorage.removeItem(getCacheKey(id));
      return null;
    }
  };

  const setToCache = (id: string, data: CachedData) => {
    if (typeof window === 'undefined') return;

    const cacheKey = getCacheKey(id);
    const cacheData: CachedData = {
      ...data,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting cache:', error);
      // 如果存储失败，尝试清理一些旧缓存再试
      try {
        // 清理一些过期数据后再尝试存储
        cleanupExpiredCache();
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (e) {
        console.error('Failed to set cache after cleanup:', e);
      }
    }
  };

  const fetchPlayer = async () => {
    if (!wcaId) {
      setIs404(true);
      return;
    }

    // 尝试从缓存获取数据
    const cachedData = getFromCache(wcaId);
    if (cachedData) {
      setWcaProfile(cachedData.wcaProfile);
      setWcaResults(cachedData.wcaResults);
      setComps(cachedData.comps);
      setIs404(false);
      setLoading(false);
      return;
    }

    try {
      // 并行发起三个请求
      const [profileRes, compsRes, resultsRes] = await Promise.all([
        getWCAPersonProfile(wcaId),
        getWCAPersonCompetitions(wcaId),
        getWCAPersonResults(wcaId),
      ]);

      // 所有请求成功
      setWcaProfile(profileRes);
      setComps(compsRes);
      setWcaResults(resultsRes);
      setIs404(false);

      // 存储到缓存
      setToCache(wcaId, {
        wcaProfile: profileRes,
        wcaResults: resultsRes,
        comps: compsRes,
        timestamp: Date.now()
      });

    } catch (error) {
      // 任何一个请求失败，都视为 404
      console.error('Failed to fetch player data:', error);
      setIs404(true);
      setWcaProfile(undefined);
      setComps([]);
      setWcaResults([]);
    }
  };

  useEffect(() => {
    // 进入页面时自动清理过期缓存
    cleanupExpiredCache();

    setLoading(true);
    fetchPlayer().finally(() => {
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wcaId]);

  if (loading || (!wcaProfile)) {
    return (
      <div style={{ textAlign: 'center', marginTop: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (is404) {
    return (
      <div style={{ textAlign: 'center', color: '#999', marginTop: 50 }}>未找到该选手信息</div>
    );
  }

  if (wcaResults) {
    document.title = `${wcaProfile.person.name} 的WCA成绩页`;
  }

  return (
    <div>
      <WCAPlayerDetails wcaProfile={wcaProfile} wcaResults={wcaResults} />
      <WCAPlayerResultTable wcaProfile={wcaProfile} wcaResults={wcaResults} />
      <WCAPlayerStaticsTab wcaProfile={wcaProfile} wcaResults={wcaResults} comps={comps} />
    </div>
  );
};

export default WCAPlayer;



