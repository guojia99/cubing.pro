"use client";

import {
  Box,
  Button,
  Checkbox,
  Dialog,
  Portal,
  Text,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { LuTag, LuTrash2 } from "react-icons/lu";

import "@/views/FoodShared/tonight-receipt.css";

export interface TonightReceiptItem {
  key: string;
  name: string;
}

export interface TonightIngredientMeta {
  name: string;
  count: number;
  itemNames: string[];
}

interface TonightReceiptProps {
  title: string;
  emptyText: string;
  clearTitle: string;
  clearMessage: string;
  tagLabel: string;
  items: TonightReceiptItem[];
  ingredients: TonightIngredientMeta[];
  getCheckedIngredients: () => Set<string>;
  toggleIngredientChecked: (name: string) => void;
  onClear: () => void;
}

export function TonightReceipt({
  title,
  emptyText,
  clearTitle,
  clearMessage,
  tagLabel,
  items,
  ingredients,
  getCheckedIngredients,
  toggleIngredientChecked,
  onClear,
}: TonightReceiptProps) {
  const [showTags, setShowTags] = useState(true);
  const [clearOpen, setClearOpen] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(() => getCheckedIngredients());

  const handleToggle = useCallback(
    (ingredient: string) => {
      toggleIngredientChecked(ingredient);
      setCheckedIngredients(getCheckedIngredients());
    },
    [getCheckedIngredients, toggleIngredientChecked],
  );

  const handleClearAll = useCallback(() => {
    onClear();
    setClearOpen(false);
    setCheckedIngredients(new Set());
  }, [onClear]);

  if (items.length === 0) {
    return (
      <Box className="tonight-receipt tonight-receipt-empty" bg="bg" borderWidth="1px" borderStyle="dashed" borderColor="border" color="fg.muted">
        <div className="tonight-receipt-header">{title}</div>
        <div className="tonight-receipt-body" style={{ padding: 24, textAlign: "center" }}>
          {emptyText}
        </div>
      </Box>
    );
  }

  return (
    <>
      <Box
        className="tonight-receipt"
        bg="#fffef8"
        borderWidth="1px"
        borderColor="border"
        boxShadow="sm"
        _dark={{ bg: "bg.muted" }}
      >
        <div className="tonight-receipt-header">
          <span>{title}</span>
          <div className="tonight-receipt-actions">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setShowTags(!showTags)}
              color={showTags ? "accent" : "fg.muted"}
            >
              <LuTag />
              {showTags ? "隐藏" : "显示"}
              {tagLabel}
            </Button>
            <Button variant="ghost" size="xs" colorPalette="red" onClick={() => setClearOpen(true)}>
              <LuTrash2 />
              清空
            </Button>
          </div>
        </div>
        <div className="tonight-receipt-body">
          <div className="tonight-receipt-dishes">
            {items.map((item) => (
              <div key={item.key} className="tonight-receipt-dish">
                {item.name}
              </div>
            ))}
          </div>
          <div className="tonight-receipt-divider" />
          <div className="tonight-receipt-ingredients">
            {ingredients.map(({ name, count, itemNames }) => {
              const checked = checkedIngredients.has(name);
              return (
                <div
                  key={name}
                  className="tonight-receipt-ingredient"
                  style={{
                    textDecoration: checked ? "line-through" : "none",
                    color: checked ? "var(--chakra-colors-fg-muted)" : undefined,
                  }}
                >
                  <Checkbox.Root checked={checked} onCheckedChange={() => handleToggle(name)} mr="2">
                    <Checkbox.HiddenInput />
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                  </Checkbox.Root>
                  <Text as="span" fontSize="14px">
                    {name}
                    {count > 1 ? (
                      <Text as="span" color="accent" ml="1">
                        ({count})
                      </Text>
                    ) : null}
                    {showTags && itemNames.length > 0 ? (
                      <span className="tonight-receipt-tag" style={{ marginLeft: 6 }}>
                        [{itemNames.join("、")}]
                      </span>
                    ) : null}
                  </Text>
                </div>
              );
            })}
          </div>
        </div>
      </Box>

      <Dialog.Root open={clearOpen} onOpenChange={(e) => setClearOpen(e.open)} role="alertdialog">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>{clearTitle}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>{clearMessage}</Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => setClearOpen(false)}>
                  取消
                </Button>
                <Button colorPalette="red" onClick={handleClearAll}>
                  确认清空
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
