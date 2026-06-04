"use client";

import {
  Box,
  Field,
  Flex,
  NativeSelect,
  Slider,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useI18n } from "@/contexts/I18nProvider";
import {
  type FormulaFontFamilyId,
  FORMULA_FONT_FAMILY_IDS,
  getFormulaFontFamilyCSSValue,
  getFormulaFontFamilyLabel,
} from "../utils/formulaFontFamily";
import {
  MAX_DIAGRAM_SIZE,
  MIN_DIAGRAM_SIZE,
  getDiagramDimensions,
} from "../utils/diagramDisplay";
import AlgsCubeDiagram from "./AlgsCubeDiagram";

interface Props {
  cube: string;
  classId: string;
  formulaFontSize: number;
  onFormulaFontSizeChange: (n: number) => void;
  formulaFontFamily: FormulaFontFamilyId;
  onFormulaFontFamilyChange: (id: FormulaFontFamilyId) => void;
  columnsPerRow: number;
  onColumnsPerRowChange: (n: number) => void;
  diagramSize: number;
  onDiagramSizeChange: (n: number) => void;
  hideFormulaDiagram: boolean;
  onHideFormulaDiagramChange: (b: boolean) => void;
  showVisualCubeSwitch: boolean;
  useVisualCube: boolean;
  onUseVisualCubeChange: (b: boolean) => void;
  showHideAltFormulas: boolean;
  hideAltFormulas: boolean;
  onHideAltFormulasChange: (b: boolean) => void;
  previewFormula?: string;
  previewName?: string;
  previewImageSvg?: string;
  previewScramble?: string;
  previewSetName?: string;
  previewGroupName?: string;
}

function SettingsPreview({
  formulaFontSize,
  formulaFontFamily,
  previewFormula,
  previewName,
}: {
  formulaFontSize: number;
  formulaFontFamily: FormulaFontFamilyId;
  previewFormula: string;
  previewName: string;
}) {
  const fontCss = getFormulaFontFamilyCSSValue(formulaFontFamily);

  return (
    <Box
      mt={2}
      p={3}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border"
      bg="bg.muted"
    >
      {previewName ? (
        <Text fontSize="xs" color="fg.muted" mb={1} lineClamp={1}>
          {previewName}
        </Text>
      ) : null}
      <Text
        fontFamily={fontCss}
        fontSize={`${formulaFontSize}px`}
        lineHeight={1.45}
        color="accent"
        fontWeight="semibold"
        wordBreak="break-all"
      >
        {previewFormula}
      </Text>
    </Box>
  );
}

export default function AlgsPageSettingsPanel({
  cube,
  classId,
  formulaFontSize,
  onFormulaFontSizeChange,
  formulaFontFamily,
  onFormulaFontFamilyChange,
  columnsPerRow,
  onColumnsPerRowChange,
  diagramSize,
  onDiagramSizeChange,
  hideFormulaDiagram,
  onHideFormulaDiagramChange,
  showVisualCubeSwitch,
  useVisualCube,
  onUseVisualCubeChange,
  showHideAltFormulas,
  hideAltFormulas,
  onHideAltFormulasChange,
  previewFormula,
  previewName,
  previewImageSvg,
  previewScramble,
  previewSetName = "",
  previewGroupName = "",
}: Props) {
  const { t, locale } = useI18n();
  const sampleFormula =
    previewFormula?.trim() ||
    (locale === "zh-CN"
      ? t("algs.config.previewFormulaZh")
      : t("algs.config.previewFormulaEn"));
  const sampleName = previewName?.trim() ?? "";
  const diagramDims = getDiagramDimensions(diagramSize, "square");
  const canPreviewDiagram =
    !hideFormulaDiagram &&
    Boolean(previewSetName && previewGroupName && (previewImageSvg || useVisualCube));

  return (
    <VStack align="stretch" gap={5}>
      <Field.Root>
        <Field.Label fontSize="sm" mb={1}>
          {t("algs.config.fontSize")} ({formulaFontSize}px)
        </Field.Label>
        <Slider.Root
          width="100%"
          colorPalette="brand"
          min={8}
          max={32}
          step={1}
          value={[formulaFontSize]}
          onValueChange={(details) => {
            const v = details.value[0];
            if (v != null) onFormulaFontSizeChange(v);
          }}
        >
          <Slider.Control>
            <Slider.Track>
              <Slider.Range />
            </Slider.Track>
            <Slider.Thumb index={0} />
          </Slider.Control>
        </Slider.Root>
        <SettingsPreview
          formulaFontSize={formulaFontSize}
          formulaFontFamily={formulaFontFamily}
          previewFormula={sampleFormula}
          previewName={sampleName}
        />
      </Field.Root>

      <Field.Root>
        <Field.Label fontSize="sm" mb={1}>
          {t("algs.config.columns")} ({columnsPerRow})
        </Field.Label>
        <Slider.Root
          width="100%"
          colorPalette="brand"
          min={1}
          max={8}
          step={1}
          value={[columnsPerRow]}
          onValueChange={(details) => {
            const v = details.value[0];
            if (v != null) onColumnsPerRowChange(v);
          }}
        >
          <Slider.Control>
            <Slider.Track>
              <Slider.Range />
            </Slider.Track>
            <Slider.Thumb index={0} />
          </Slider.Control>
        </Slider.Root>
      </Field.Root>

      <Switch.Root
        width="100%"
        size="sm"
        colorPalette="brand"
        checked={hideFormulaDiagram}
        onCheckedChange={(e) => onHideFormulaDiagramChange(e.checked === true)}
      >
        <Switch.HiddenInput />
        <Flex
          as="span"
          width="100%"
          align="center"
          justify="space-between"
          gap={3}
          cursor="pointer"
        >
          <Switch.Label fontSize="sm" flex={1} cursor="pointer">
            {t("algs.config.hideDiagram")}
          </Switch.Label>
          <Switch.Control cursor="pointer">
            <Switch.Thumb />
          </Switch.Control>
        </Flex>
      </Switch.Root>

      <Field.Root opacity={hideFormulaDiagram ? 0.5 : 1}>
        <Field.Label fontSize="sm" mb={1}>
          {t("algs.config.diagramSize")} ({diagramSize}px)
        </Field.Label>
        <Slider.Root
          width="100%"
          colorPalette="brand"
          min={MIN_DIAGRAM_SIZE}
          max={MAX_DIAGRAM_SIZE}
          step={4}
          value={[diagramSize]}
          disabled={hideFormulaDiagram}
          onValueChange={(details) => {
            const v = details.value[0];
            if (v != null) onDiagramSizeChange(v);
          }}
        >
          <Slider.Control>
            <Slider.Track>
              <Slider.Range />
            </Slider.Track>
            <Slider.Thumb index={0} />
          </Slider.Control>
        </Slider.Root>
        {canPreviewDiagram && (
          <Box
            mt={2}
            p={3}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="border"
            bg="bg.muted"
            display="flex"
            justifyContent="center"
          >
            <Box maxW={`${diagramDims.maxWidth}px`} w="100%">
              <AlgsCubeDiagram
                cube={cube}
                classId={classId}
                setName={previewSetName}
                groupName={previewGroupName}
                imageSvg={previewImageSvg}
                scramble={previewScramble}
                formula={sampleFormula}
                useVisualCube={useVisualCube}
                maxWidth={diagramDims.maxWidth}
                maxHeight={diagramDims.maxHeight}
              />
            </Box>
          </Box>
        )}
      </Field.Root>

      {showHideAltFormulas && (
        <Switch.Root
          width="100%"
          size="sm"
          colorPalette="brand"
          checked={hideAltFormulas}
          onCheckedChange={(e) => onHideAltFormulasChange(e.checked === true)}
        >
          <Switch.HiddenInput />
          <Flex
            as="span"
            width="100%"
            align="center"
            justify="space-between"
            gap={3}
            cursor="pointer"
          >
            <Switch.Label fontSize="sm" flex={1} cursor="pointer">
              {t("algs.config.hideAlg")}
            </Switch.Label>
            <Switch.Control cursor="pointer">
              <Switch.Thumb />
            </Switch.Control>
          </Flex>
        </Switch.Root>
      )}

      {showVisualCubeSwitch && (
        <Switch.Root
          width="100%"
          size="sm"
          colorPalette="brand"
          checked={useVisualCube}
          onCheckedChange={(e) => onUseVisualCubeChange(e.checked === true)}
        >
          <Switch.HiddenInput />
          <Flex
            as="span"
            width="100%"
            align="center"
            justify="space-between"
            gap={3}
            cursor="pointer"
          >
            <Switch.Label fontSize="sm" flex={1} cursor="pointer">
              {t("algs.config.visualCube")}
            </Switch.Label>
            <Switch.Control cursor="pointer">
              <Switch.Thumb />
            </Switch.Control>
          </Flex>
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
                {getFormulaFontFamilyLabel(id, locale)}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
        <SettingsPreview
          formulaFontSize={formulaFontSize}
          formulaFontFamily={formulaFontFamily}
          previewFormula={sampleFormula}
          previewName={sampleName}
        />
      </Field.Root>
    </VStack>
  );
}
