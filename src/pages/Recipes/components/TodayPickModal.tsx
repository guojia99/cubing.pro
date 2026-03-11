import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal, Select, theme } from 'antd';
import { useNavigate } from '@@/exports';
import type { Recipe, RecipesData } from '../types';
import './TodayPickModal.less';

interface TodayPickModalProps {
  open: boolean;
  onClose: () => void;
  data: RecipesData | null;
}

const SPIN_DURATION = 2500;
const SPIN_INTERVAL_INITIAL = 50;
const SPIN_INTERVAL_FINAL = 150;

const TodayPickModal: React.FC<TodayPickModalProps> = ({ open, onClose, data }) => {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterDifficulties, setFilterDifficulties] = useState<number[]>([]);
  const [phase, setPhase] = useState<'filter' | 'spinning' | 'result'>('filter');
  const [displayName, setDisplayName] = useState('');
  const [resultRecipe, setResultRecipe] = useState<Recipe | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recipes = data?.recipes ?? [];
  const categoryOptions = [
    ...new Map(
      recipes.map((r) => [r.category, { value: r.category, label: r.categoryName }]),
    ).values(),
  ].filter((o) => o.value !== 'template');

  const filteredRecipes = recipes.filter((r) => {
    if (filterCategories.length > 0 && !filterCategories.includes(r.category)) return false;
    if (filterDifficulties.length > 0 && !filterDifficulties.includes(r.difficulty)) return false;
    return true;
  });

  const getDisplayName = (r: Recipe) => r.title.replace(/的做法$/, '');

  const startSpin = () => {
    if (filteredRecipes.length === 0) return;
    setPhase('spinning');
    const names = filteredRecipes.map(getDisplayName);
    const resultIdx = Math.floor(Math.random() * filteredRecipes.length);
    const result = filteredRecipes[resultIdx];
    const shuffled = [...names].sort(() => Math.random() - 0.5);

    const startTime = Date.now();
    let tickCount = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const interval =
        SPIN_INTERVAL_INITIAL +
        (SPIN_INTERVAL_FINAL - SPIN_INTERVAL_INITIAL) * eased;
      tickCount += 1;
      setDisplayName(shuffled[tickCount % shuffled.length]);

      if (progress < 1) {
        intervalRef.current = setTimeout(tick, interval);
      } else {
        setDisplayName(getDisplayName(result));
        setResultRecipe(result);
        setPhase('result');
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
      setResultRecipe(null);
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  const handleViewRecipe = () => {
    if (resultRecipe) {
      navigate(
        `/recipes/${encodeURIComponent(resultRecipe.category)}/${encodeURIComponent(resultRecipe.id)}`,
      );
      onClose();
    }
  };

  const handleAgain = () => {
    setPhase('filter');
    setResultRecipe(null);
  };

  return (
    <Modal
      title="今天吃什么"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={420}
      centered
      destroyOnClose
      styles={{ body: { paddingTop: 8 } }}
    >
      {phase === 'filter' && (
        <div className="today-pick-modal-filter">
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontSize: 13, color: token.colorTextSecondary }}>
              分类（可多选）
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
          <div style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 8, fontSize: 13, color: token.colorTextSecondary }}>
              难度（可多选）
            </div>
            <Select
              mode="multiple"
              placeholder="全部难度"
              allowClear
              style={{ width: '100%', borderRadius: 8 }}
              value={filterDifficulties}
              onChange={setFilterDifficulties}
              options={[1, 2, 3, 4, 5].map((d) => ({ value: d, label: `${d}星` }))}
            />
          </div>
          <div style={{ fontSize: 13, color: token.colorTextTertiary, marginBottom: 16 }}>
            共 {filteredRecipes.length} 道菜可选
          </div>
          <Button
            type="primary"
            block
            size="large"
            onClick={startSpin}
            disabled={filteredRecipes.length === 0}
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
              fontSize: 28,
              fontWeight: 600,
              color: token.colorPrimary,
              textAlign: 'center',
              padding: '40px 20px',
              minHeight: 120,
            }}
          >
            {displayName}
          </div>
          {phase === 'result' && resultRecipe && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Button onClick={handleAgain} style={{ borderRadius: 8 }}>
                再选一次
              </Button>
              <Button type="primary" onClick={handleViewRecipe} style={{ borderRadius: 8 }}>
                查看菜谱
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default TodayPickModal;
