import React, { useCallback, useMemo, useState } from 'react';
import { Button, Checkbox, Modal, theme } from 'antd';
import { DeleteOutlined, TagOutlined } from '@ant-design/icons';
import type { Recipe } from '../types';
import type { TonightRecipe } from '../utils/tonightStorage';
import {
  clearTonightList,
  getCheckedIngredients,
  toggleIngredientChecked,
} from '../utils/tonightStorage';
import './TonightReceipt.less';

export interface IngredientWithMeta {
  name: string;
  count: number;
  dishNames: string[];
}

interface TonightReceiptProps {
  recipes: Recipe[];
  tonightList: TonightRecipe[];
  onClear: () => void;
}

const TonightReceipt: React.FC<TonightReceiptProps> = ({
  recipes,
  tonightList,
  onClear,
}) => {
  const { token } = theme.useToken();
  const [showTags, setShowTags] = useState(true);
  const [clearModalOpen, setClearModalOpen] = useState(false);

  const recipeMap = useMemo(() => {
    const m = new Map<string, Recipe>();
    recipes.forEach((r) => m.set(`${r.category}-${r.id}`, r));
    return m;
  }, [recipes]);

  const tonightRecipes = useMemo(() => {
    return tonightList
      .map((t) => recipeMap.get(`${t.category}-${t.id}`))
      .filter((r): r is Recipe => !!r);
  }, [tonightList, recipeMap]);

  const ingredientsAggregated = useMemo((): IngredientWithMeta[] => {
    const map = new Map<string, { count: number; dishNames: string[]; order: number }>();
    let orderIndex = 0;
    tonightRecipes.forEach((r) => {
      const displayName = r.title.replace(/的做法$/, '');
      (r.ingredients ?? []).forEach((ing) => {
        const existing = map.get(ing);
        if (existing) {
          existing.count += 1;
          if (!existing.dishNames.includes(displayName)) {
            existing.dishNames.push(displayName);
          }
        } else {
          map.set(ing, { count: 1, dishNames: [displayName], order: orderIndex++ });
        }
      });
    });
    return Array.from(map.entries())
      .map(([name, meta]) => ({ name, ...meta }))
      .sort((a, b) => a.order - b.order)
      .map(({ name, count, dishNames }) => ({ name, count, dishNames }));
  }, [tonightRecipes]);

  const checkedSet = useMemo(() => getCheckedIngredients(), []);
  const [checkedIngredients, setCheckedIngredientsState] = useState<Set<string>>(checkedSet);

  const handleToggle = useCallback((ingredient: string) => {
    toggleIngredientChecked(ingredient);
    setCheckedIngredientsState(getCheckedIngredients());
  }, []);

  const handleClearAll = useCallback(() => {
    clearTonightList();
    setClearModalOpen(false);
    onClear();
  }, [onClear]);

  if (tonightList.length === 0) {
    return (
      <div
        className="tonight-receipt tonight-receipt-empty"
        style={{
          background: token.colorBgContainer,
          border: `1px dashed ${token.colorBorderSecondary}`,
          color: token.colorTextTertiary,
        }}
      >
        <div className="tonight-receipt-header">购物小票</div>
        <div className="tonight-receipt-body" style={{ padding: 24, textAlign: 'center' }}>
          暂无菜谱，去添加吧
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="tonight-receipt"
        style={{
          background: '#fffef8',
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div className="tonight-receipt-header">
          <span>购物小票</span>
          <div className="tonight-receipt-actions">
            <Button
              type="text"
              size="small"
              icon={<TagOutlined />}
              onClick={() => setShowTags(!showTags)}
              style={{
                color: showTags ? token.colorPrimary : token.colorTextTertiary,
                fontSize: 12,
              }}
            >
              {showTags ? '隐藏' : '显示'}菜名
            </Button>
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => setClearModalOpen(true)}
              style={{ fontSize: 12 }}
            >
              清空
            </Button>
          </div>
        </div>
        <div className="tonight-receipt-body">
          <div className="tonight-receipt-dishes">
            {tonightRecipes.map((r) => (
              <div key={`${r.category}-${r.id}`} className="tonight-receipt-dish">
                {r.title.replace(/的做法$/, '')}
              </div>
            ))}
          </div>
          <div className="tonight-receipt-divider" />
          <div className="tonight-receipt-ingredients">
            {ingredientsAggregated.map(({ name, count, dishNames }) => {
              const checked = checkedIngredients.has(name);
              return (
                <div
                  key={name}
                  className="tonight-receipt-ingredient"
                  style={{
                    textDecoration: checked ? 'line-through' : 'none',
                    color: checked ? token.colorTextTertiary : token.colorText,
                  }}
                >
                  <Checkbox
                    checked={checked}
                    onChange={() => handleToggle(name)}
                    style={{ marginRight: 8 }}
                  />
                  <span>
                    {name}
                    {count > 1 && (
                      <span style={{ color: token.colorPrimary, marginLeft: 4 }}>
                        ({count})
                      </span>
                    )}
                    {showTags && dishNames.length > 0 && (
                      <span className="tonight-receipt-tag" style={{ marginLeft: 6 }}>
                        [{dishNames.join('、')}]
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        title="清空今晚吃啥"
        open={clearModalOpen}
        onCancel={() => setClearModalOpen(false)}
        onOk={handleClearAll}
        okText="确认清空"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要清空「今晚吃啥」清单吗？已勾选的购物项也会被清除。</p>
      </Modal>
    </>
  );
};

export default TonightReceipt;
