import React, { useCallback, useMemo, useState } from 'react';
import { Button, Checkbox, Modal, theme } from 'antd';
import { DeleteOutlined, TagOutlined } from '@ant-design/icons';
import type { Cocktail } from '../types';
import type { TonightCocktail } from '../utils/cocktailTonightStorage';
import { getCocktailZhName } from '../cocktailNameZhMap';
import {
  clearCocktailTonightList,
  getCocktailTonightCheckedIngredients,
  toggleCocktailTonightIngredientChecked,
} from '../utils/cocktailTonightStorage';
import '@/pages/Recipes/components/TonightReceipt.less';

export interface CocktailIngredientMeta {
  name: string;
  count: number;
  drinkNames: string[];
}

interface CocktailTonightReceiptProps {
  cocktails: Cocktail[];
  tonightList: TonightCocktail[];
  onClear: () => void;
}

const CocktailTonightReceipt: React.FC<CocktailTonightReceiptProps> = ({
  cocktails,
  tonightList,
  onClear,
}) => {
  const { token } = theme.useToken();
  const [showTags, setShowTags] = useState(true);
  const [clearModalOpen, setClearModalOpen] = useState(false);

  const cocktailMap = useMemo(() => {
    const m = new Map<string, Cocktail>();
    cocktails.forEach((c) => m.set(c.slug, c));
    return m;
  }, [cocktails]);

  const tonightCocktails = useMemo(() => {
    return tonightList.map((t) => cocktailMap.get(t.slug)).filter((c): c is Cocktail => !!c);
  }, [tonightList, cocktailMap]);

  const ingredientsAggregated = useMemo((): CocktailIngredientMeta[] => {
    const map = new Map<string, { count: number; drinkNames: string[]; order: number }>();
    let orderIndex = 0;
    tonightCocktails.forEach((c) => {
      const displayZh = getCocktailZhName(c.slug, c.name);
      (c.ingredients ?? []).forEach((ing) => {
        const existing = map.get(ing);
        if (existing) {
          existing.count += 1;
          if (!existing.drinkNames.includes(displayZh)) {
            existing.drinkNames.push(displayZh);
          }
        } else {
          map.set(ing, { count: 1, drinkNames: [displayZh], order: orderIndex++ });
        }
      });
    });
    return Array.from(map.entries())
      .map(([name, meta]) => ({ name, ...meta }))
      .sort((a, b) => a.order - b.order)
      .map(({ name, count, drinkNames }) => ({ name, count, drinkNames }));
  }, [tonightCocktails]);

  const checkedSet = useMemo(() => getCocktailTonightCheckedIngredients(), []);
  const [checkedIngredients, setCheckedIngredientsState] = useState<Set<string>>(checkedSet);

  const handleToggle = useCallback((ingredient: string) => {
    toggleCocktailTonightIngredientChecked(ingredient);
    setCheckedIngredientsState(getCocktailTonightCheckedIngredients());
  }, []);

  const handleClearAll = useCallback(() => {
    clearCocktailTonightList();
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
        <div className="tonight-receipt-header">备料小票</div>
        <div className="tonight-receipt-body" style={{ padding: 24, textAlign: 'center' }}>
          暂无酒款，去添加吧
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
          <span>备料小票</span>
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
              {showTags ? '隐藏' : '显示'}酒名
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
            {tonightCocktails.map((c) => (
              <div key={c.slug} className="tonight-receipt-dish">
                {getCocktailZhName(c.slug, c.name)}
              </div>
            ))}
          </div>
          <div className="tonight-receipt-divider" />
          <div className="tonight-receipt-ingredients">
            {ingredientsAggregated.map(({ name, count, drinkNames }) => {
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
                    {showTags && drinkNames.length > 0 && (
                      <span className="tonight-receipt-tag" style={{ marginLeft: 6 }}>
                        [{drinkNames.join('、')}]
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
        title="清空今晚喝什么"
        open={clearModalOpen}
        onCancel={() => setClearModalOpen(false)}
        onOk={handleClearAll}
        okText="确认清空"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要清空「今晚喝什么」清单吗？已勾选的备料项也会被清除。</p>
      </Modal>
    </>
  );
};

export default CocktailTonightReceipt;
