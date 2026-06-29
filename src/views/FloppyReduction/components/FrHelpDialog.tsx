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
import { FR_COLORS } from "@/views/FloppyReduction/utils/constants";
import {
  algTable,
  cornerCases,
  edgeCases,
  type CaseItem,
} from "@/views/FloppyReduction/utils/caseData";

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
              <Badge colorPalette={FR_COLORS.palette} mb="1">
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
