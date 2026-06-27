"use client";

import {
  Badge,
  Box,
  Dialog,
  Heading,
  Portal,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";

import { useI18n } from "@/contexts/I18nProvider";

const FrCube3D = dynamic(
  () => import("@/views/FloppyReduction/components/FrCube3D").then((m) => m.FrCube3D),
  {
    ssr: false,
    loading: () => (
      <Box display="flex" justifyContent="center" alignItems="center" h="120px" w="120px">
        <Spinner size="sm" />
      </Box>
    ),
  },
);

interface CaseItem {
  label: string;
  /** 该 case 的纯净示例 setup（UD 轴），由半转群搜索得到 */
  setup: string;
  zh: string;
  en: string;
}

const cornerCases: CaseItem[] = [
  {
    label: "0",
    setup: "",
    zh: "每组角块上下成柱：顶/底层正对，已是 FR 角形，无需调整。",
    en: "Each pair forms a pillar (top/bottom aligned). Already the FR corner shape.",
  },
  {
    label: "1",
    setup: "U2 R2 F2 R2 F2 U2 F2",
    zh: "上下分离但未对齐，做一个轴向半转（U2/D2）即可对成柱。",
    en: "Split top/bottom but not aligned; one axis half-turn (U2/D2) makes the pillars.",
  },
  {
    label: "2RL",
    setup: "U2 R2 F2 R2 F2 U2",
    zh: "一组角同处一层并落在 R/L 面上（如 UFR-UBR）。最灵活，两轴半转都不改变它。",
    en: "A pair sits in one layer on an R/L face (e.g. UFR-UBR). The most flexible case.",
  },
  {
    label: "2FB",
    setup: "U2 F2 R2 F2 R2 U2",
    zh: "一组角同处一层并落在 F/B 面上（如 UFL-UFR）。同样很灵活。",
    en: "A pair sits in one layer on an F/B face (e.g. UFL-UFR). Also very flexible.",
  },
];

const edgeCases: CaseItem[] = [
  {
    label: "4-0",
    setup: "U2 R2 F2 R2 F2 U2 F2 U2",
    zh: "4 个坏棱全在一层。直接 U2 即可解决。",
    en: "All 4 bad edges in one layer. A single U2 fixes it.",
  },
  {
    label: "3-1",
    setup: "U2 R2 U2 R2 F2 U2 F2 U2",
    zh: "3 个坏棱在一层、1 个在另一层。最常见的基础 case（FR trigger）。",
    en: "3 bad in one layer, 1 in the other. The basic FR-trigger case.",
  },
  {
    label: "2-2o",
    setup: "U2 R2 L2 U2",
    zh: "每层 2 个坏棱，且层内两棱在对面（如 UF-UB）。",
    en: "2 bad per layer, opposite each other within the layer (e.g. UF-UB).",
  },
  {
    label: "2-2a",
    setup: "U2 R2 F2 R2 F2 R2 F2 U2",
    zh: "每层 2 个坏棱，且层内两棱相邻（如 UL-UB）。",
    en: "2 bad per layer, adjacent within the layer (e.g. UL-UB).",
  },
];

const algTable: { c: string; alg: string }[] = [
  { c: "4-0 / 1", alg: "U2" },
  { c: "3-1 / 2FB", alg: "R2 U2" },
  { c: "2-2a / 2FB", alg: "F2 R2 U2" },
  { c: "2-2a / 2RL", alg: "R2 F2 U2" },
  { c: "2-2o / 1", alg: "R2 L2 U2" },
  { c: "3-1 / 1", alg: "F2 R2 F2 U2" },
  { c: "4-0 / 2FB", alg: "R2 F2 R2 F2 U2" },
  { c: "2-2o / 2FB", alg: "L2 F2 R2 F2 U2" },
  { c: "2-2o / 2RL", alg: "F2 L2 F2 R2 U2" },
  { c: "3-1 / 2RL", alg: "L2 F2 L2 F2 R2 U2" },
];

function CaseSection({
  title,
  cases,
  zh,
  emphasis,
}: {
  title: string;
  cases: CaseItem[];
  zh: boolean;
  emphasis: "corners" | "edges";
}) {
  return (
    <Box>
      <Heading size="sm" mb="2">
        {title}
      </Heading>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3">
        {cases.map((c) => (
          <Box
            key={c.label}
            borderWidth="1px"
            borderRadius="md"
            p="2"
            display="flex"
            gap="2"
            alignItems="center"
          >
            <Box flexShrink="0" w="120px">
              <FrCube3D
                scramble={c.setup}
                axisKey="ud"
                solution={null}
                height={120}
                showBackView={false}
                emphasis={emphasis}
              />
            </Box>
            <Box>
              <Badge colorPalette="purple" mb="1">
                {c.label}
              </Badge>
              <Text fontSize="xs" color="fg.muted">
                {zh ? c.zh : c.en}
              </Text>
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}

export function FrHelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, locale } = useI18n();
  const zh = locale === "zh-CN";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      size="lg"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t("fr.help.title")}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="5">
                <Text fontSize="xs" color="fg.muted">
                  {zh
                    ? "下列示例均以 U/D 轴为 FR 轴；角形示例隐藏了所有棱、坏棱示例隐藏了所有角，淡色棱为该轴忽略的中层棱。"
                    : "Examples below use the U/D axis as the FR axis; corner cases hide all edges and edge cases hide all corners. Dimmed edges are the ignored middle-layer edges."}
                </Text>
                <CaseSection
                  title={zh ? "角形（角块）" : "Corner cases"}
                  cases={cornerCases}
                  zh={zh}
                  emphasis="corners"
                />
                <CaseSection
                  title={zh ? "坏棱（棱块）" : "Edge cases"}
                  cases={edgeCases}
                  zh={zh}
                  emphasis="edges"
                />

                <Box>
                  <Heading size="sm" mb="2">
                    {zh ? "常见 case 参考公式（UD 轴）" : "Reference algs (UD axis)"}
                  </Heading>
                  <Table.Root size="sm" variant="outline">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>
                          {zh ? "棱 / 角" : "Edge / Corner"}
                        </Table.ColumnHeader>
                        <Table.ColumnHeader>{zh ? "公式" : "Alg"}</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {algTable.map((row) => (
                        <Table.Row key={row.c}>
                          <Table.Cell>{row.c}</Table.Cell>
                          <Table.Cell fontFamily="mono">{row.alg}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>

                <Box>
                  <Heading size="sm" mb="2">
                    {zh ? "真 FR vs 假 FR" : "True FR vs False FR"}
                  </Heading>
                  <Text fontSize="sm" color="fg.muted">
                    {zh
                      ? "只把角形和坏棱都做成 0 不一定是真 FR：若做 FR 过程中 U2/D2 的总数奇偶不对，就会得到假 FR（满足形态但仍需一个轴向半转才能还原）。"
                      : "Reaching 0 bad edges and the 0 corner shape is not always true FR: if the parity of U2/D2 turns is wrong you get a false FR (shape is met but one more axis half-turn is still needed)."}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" mt="2">
                    {zh
                      ? "因此，按「最短形态解」收尾有可能得到假 FR：需要在中途处于 2-2a/2 状态（此时做轴向半转不破坏进度）时插入一个 U2/D2 补齐奇偶；例如在 FR trigger 处做 [F2 U2 F2] R2 U2。本工具给出的「正确解（真 FR）」已自动补齐奇偶，可在每个结果卡的「解法解析」中查看逐步分解，对照「形态解（假 FR）」与「真 FR 解」的差别。"
                      : "So finishing with the shortest shape solution may give a false FR: insert a U2/D2 at a 2-2a/2 state (where an axis half-turn doesn't break progress) to fix parity, e.g. [F2 U2 F2] R2 U2 at the FR trigger. The tool's 'correct (true-FR) solution' is already parity-fixed; open 'Solution breakdown' on each result card to step through and compare the shape (false-FR) vs the true-FR solution."}
                  </Text>
                </Box>
              </Stack>
            </Dialog.Body>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
