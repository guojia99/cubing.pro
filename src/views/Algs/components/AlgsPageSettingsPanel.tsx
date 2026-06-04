"use client";

import { Box, Field, NativeSelect, Slider, Switch, VStack } from "@chakra-ui/react";
import { useI18n } from "@/contexts/I18nProvider";
import {
  type FormulaFontFamilyId,
  FORMULA_FONT_FAMILY_IDS,
} from "../utils/formulaFontFamily";

interface Props {
  formulaFontSize: number;
  onFormulaFontSizeChange: (n: number) => void;
  formulaFontFamily: FormulaFontFamilyId;
  onFormulaFontFamilyChange: (id: FormulaFontFamilyId) => void;
  columnsPerRow: number;
  onColumnsPerRowChange: (n: number) => void;
  showVisualCubeSwitch: boolean;
  useVisualCube: boolean;
  onUseVisualCubeChange: (b: boolean) => void;
  showHideAltFormulas: boolean;
  hideAltFormulas: boolean;
  onHideAltFormulasChange: (b: boolean) => void;
}

export default function AlgsPageSettingsPanel({
  formulaFontSize,
  onFormulaFontSizeChange,
  formulaFontFamily,
  onFormulaFontFamilyChange,
  columnsPerRow,
  onColumnsPerRowChange,
  showVisualCubeSwitch,
  useVisualCube,
  onUseVisualCubeChange,
  showHideAltFormulas,
  hideAltFormulas,
  onHideAltFormulasChange,
}: Props) {
  const { t } = useI18n();

  return (
    <VStack align="stretch" gap={5}>
      <Field.Root>
        <Field.Label fontSize="sm" mb={1}>
          {t("algs.config.fontSize")} ({formulaFontSize}px)
        </Field.Label>
        <Slider.Root
          min={8}
          max={32}
          step={1}
          value={[formulaFontSize]}
          onValueChange={(details) => {
            const v = details.value[0];
            if (v != null) onFormulaFontSizeChange(v);
          }}
        >
          <Slider.Track>
            <Slider.Range />
          </Slider.Track>
          <Slider.Thumb index={0}>
            <Slider.ValueText />
          </Slider.Thumb>
        </Slider.Root>
      </Field.Root>

      <Field.Root>
        <Field.Label fontSize="sm" mb={1}>
          {t("algs.config.columns")} ({columnsPerRow})
        </Field.Label>
        <Slider.Root
          min={1}
          max={8}
          step={1}
          value={[columnsPerRow]}
          onValueChange={(details) => {
            const v = details.value[0];
            if (v != null) onColumnsPerRowChange(v);
          }}
        >
          <Slider.Track>
            <Slider.Range />
          </Slider.Track>
          <Slider.Thumb index={0}>
            <Slider.ValueText />
          </Slider.Thumb>
        </Slider.Root>
      </Field.Root>

      {showHideAltFormulas && (
        <Switch.Root
          checked={hideAltFormulas}
          onCheckedChange={(details) => onHideAltFormulasChange(!!details.checked)}
        >
          <Box display="flex" alignItems="center" gap={3}>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label fontSize="sm">
              {t("algs.config.hideAlg")}
            </Switch.Label>
          </Box>
        </Switch.Root>
      )}

      {showVisualCubeSwitch && (
        <Switch.Root
          checked={useVisualCube}
          onCheckedChange={(details) => onUseVisualCubeChange(!!details.checked)}
        >
          <Box display="flex" alignItems="center" gap={3}>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label fontSize="sm">
              {t("algs.config.visualCube")}
            </Switch.Label>
          </Box>
        </Switch.Root>
      )}

      <Field.Root>
        <Field.Label fontSize="sm" mb={1}>
          {t("algs.config.fontFamily")}
        </Field.Label>
        <NativeSelect.Root>
          <NativeSelect.Field
            value={formulaFontFamily}
            onChange={(e) =>
              onFormulaFontFamilyChange(e.target.value as FormulaFontFamilyId)
            }
          >
            {FORMULA_FONT_FAMILY_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Field.Root>
    </VStack>
  );
}
