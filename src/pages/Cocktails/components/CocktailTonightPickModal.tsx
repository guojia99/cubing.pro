import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal, Select, theme } from 'antd';
import { useNavigate } from '@@/exports';
import type { Cocktail } from '../types';
import { getCategoryLabelZh } from '../categoryZh';
import { getCocktailZhName } from '../cocktailNameZhMap';
import {
  appendTodayCocktailSpin,
} from '../utils/cocktailSpinHistory';
import '@/pages/Recipes/components/TodayPickModal.less';

interface CocktailTonightPickModalProps {
  open: boolean;
  onClose: () => void;
  cocktails: Cocktail[];
}

const SPIN_DURATION = 2500;
const SPIN_INTERVAL_INITIAL = 50;
const SPIN_INTERVAL_FINAL = 150;

const CocktailTonightPickModal: React.FC<CocktailTonightPickModalProps> = ({
  open,
  onClose,
  cocktails,
}) => {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [phase, setPhase] = useState<'filter' | 'spinning' | 'result'>('filter');
  const [displayName, setDisplayName] = useState('');
  const [resultCocktail, setResultCocktail] = useState<Cocktail | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoryOptions = useMemo(() => {
    const cats = [...new Set(cocktails.map((c) => c.category))];
    return cats.map((c) => ({ value: c, label: getCategoryLabelZh(c) }));
  }, [cocktails]);

  const filteredCocktails = useMemo(
    () =>
      cocktails.filter((c) => {
        if (filterCategories.length > 0 && !filterCategories.includes(c.category)) return false;
        return true;
      }),
    [cocktails, filterCategories],
  );

  const getDisplayZh = (c: Cocktail) => getCocktailZhName(c.slug, c.name);

  const startSpin = () => {
    if (filteredCocktails.length === 0) return;
    setPhase('spinning');
    const names = filteredCocktails.map(getDisplayZh);
    const resultIdx = Math.floor(Math.random() * filteredCocktails.length);
    const result = filteredCocktails[resultIdx];
    const shuffled = [...names].sort(() => Math.random() - 0.5);

    const startTime = Date.now();
    let tickCount = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      const eased = 1 - (1 - progress) ** 3;
      const interval =
        SPIN_INTERVAL_INITIAL + (SPIN_INTERVAL_FINAL - SPIN_INTERVAL_INITIAL) * eased;
      tickCount += 1;
      setDisplayName(shuffled[tickCount % shuffled.length]);

      if (progress < 1) {
        intervalRef.current = setTimeout(tick, interval);
      } else {
        const zh = getDisplayZh(result);
        setDisplayName(zh);
        setResultCocktail(result);
        setPhase('result');
        appendTodayCocktailSpin({
          slug: result.slug,
          zhName: zh,
          enName: result.name,
        });
      }
    };

    setDisplayName(shuffled[0]);
    intervalRef.current = setTimeout(tick, SPIN_INTERVAL_INITIAL);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setPhase('filter');
      setDisplayName('');
      setResultCocktail(null);
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [open]);

  const handleViewDetail = () => {
    if (resultCocktail) {
      navigate(`/other/cocktails/${encodeURIComponent(resultCocktail.slug)}`);
      onClose();
    }
  };

  const handleAgain = () => {
    setPhase('filter');
    setResultCocktail(null);
  };

  return (
    <Modal
      title="今晚喝什么"
      open={open}
      onCancel={onClose}
      footer={null}
      width={440}
      centered
      destroyOnClose
      styles={{ body: { paddingTop: 8 } }}
    >
      {phase === 'filter' && (
        <div className="today-pick-modal-filter">
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontSize: 13, color: token.colorTextSecondary }}>
              分类（可多选，已译为中文）
            </div>
            <Select
              mode="multiple"
              placeholder="全部分类"
              allowClear
              style={{ width: '100%', borderRadius: 8 }}
              value={filterCategories}
              onChange={setFilterCategories}
              options={categoryOptions}
            />
          </div>
          <div style={{ fontSize: 13, color: token.colorTextTertiary, marginBottom: 16 }}>
            共 {filteredCocktails.length} 款可选
          </div>
          <Button
            type="primary"
            block
            size="large"
            onClick={startSpin}
            disabled={filteredCocktails.length === 0}
            style={{ borderRadius: 8 }}
          >
            开始随机
          </Button>
        </div>
      )}

      {(phase === 'spinning' || phase === 'result') && (
        <div className="today-pick-modal-result">
          <div
            className={`today-pick-name ${phase === 'spinning' ? 'spinning' : ''}`}
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: token.colorPrimary,
              textAlign: 'center',
              padding: '36px 16px',
              minHeight: 110,
            }}
          >
            {displayName}
          </div>
          {phase === 'result' && resultCocktail && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button onClick={handleAgain} style={{ borderRadius: 8 }}>
                再选一次
              </Button>
              <Button type="primary" onClick={handleViewDetail} style={{ borderRadius: 8 }}>
                查看酒款
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default CocktailTonightPickModal;
