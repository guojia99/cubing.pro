"use client";

import {
  Badge,
  Box,
  Button,
  Heading,
  Link,
  List,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";

import { useI18n } from "@/contexts/I18nProvider";
import { TutorialCaseCard } from "@/views/FloppyReduction/components/TutorialCaseCard";
import { TutorialCubeStep } from "@/views/FloppyReduction/components/TutorialCubeStep";
import { FR_COLORS } from "@/views/FloppyReduction/utils/constants";
import {
  cornerCases,
  edgeCases,
  FALSE_FR_SETUP,
  FR_LIMITED_SCRAMBLE,
  FR_TUTORIAL_URL,
  FR_TRIGGER_SETUP,
  PARITY_INSERT_SETUP,
  TUTORIAL_SPECIAL_40_0,
  tutorialCases,
  tutorialSpecialNotes,
} from "@/views/FloppyReduction/utils/caseData";

export function FrTutorialPanel() {
  const { t, locale } = useI18n();
  const zh = locale === "zh-CN";

  const corner1Setup = cornerCases.find((c) => c.label === "1")!.setup;
  const corner2FbSetup = cornerCases.find((c) => c.label === "2FB")!.setup;
  const edge40Setup = edgeCases.find((c) => c.label === "4-0")!.setup;
  const simpleCases = tutorialCases.filter((c) => c.tier === "simple");
  const hardCases = tutorialCases.filter((c) => c.tier === "hard");

  return (
    <Stack gap="6">
      <Box>
        <Heading size="sm" mb="2">
          {t("fr.tutorial.section.intro")}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb="3" lineHeight="1.7">
          {zh
            ? "Floppy Reduction（FR）将魔方从 HTR 态（只需 R2 L2 U2 D2 F2 B2）进一步降群至 R2 L2 F2 B2 群。建议已掌握 DR 与 HTR 的最少步玩家学习。实战中可忽略 DR 轴向夹层棱，FR 只需关注所选轴的顶层与底层。"
            : "Floppy Reduction (FR) reduces a cube from HTR (R2 L2 U2 D2 F2 B2 only) to the R2 L2 F2 B2 group. Best after you know DR and HTR. In practice, ignore slice edges on the DR axis—FR only cares about the top and bottom layers of your chosen axis."}
        </Text>
        <TutorialCubeStep
          body={
            zh
              ? "还原态只做 R2 L2 F2 B2 打乱，混乱程度极其有限，很容易还原——这就是 FR 态的特点。"
              : "Scramble a solved cube with only R2 L2 F2 B2—the disorder stays very limited and is easy to solve. That is what FR looks like."
          }
          scramble={FR_LIMITED_SCRAMBLE}
          emphasis="axis"
        />
      </Box>

      <Box>
        <Heading size="sm" mb="2">
          {t("fr.tutorial.section.corners")}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb="3" lineHeight="1.7">
          {zh
            ? "FR 态下八个角两两成组（UFL-DFL 等），形成四根「柱子」：每组上下角块侧面颜色一致。HTR 后观察角与其正上/下方角能否成柱：能则为好角，否则为坏角。四组角形始终相同，记为 0 / 1 / 2RL / 2FB。"
            : "In FR, eight corners form four pillar pairs (e.g. UFL–DFL): side colors match within each pair. From HTR, check if each corner aligns with the one above/below it. All four pairs share the same shape label: 0, 1, 2RL, or 2FB."}
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="2">
          {cornerCases.map((c) => (
            <TutorialCubeStep
              key={c.label}
              title={c.label}
              body={zh ? c.zh : c.en}
              scramble={c.setup}
              emphasis="corners"
              height={120}
            />
          ))}
        </SimpleGrid>
      </Box>

      <Box>
        <Heading size="sm" mb="2">
          {t("fr.tutorial.section.edges")}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb="3" lineHeight="1.7">
          {zh
            ? "好棱：侧面颜色与中心块对齐（类似十字）。FR 关注 8 个棱（不含夹层），坏棱数可为 0 / 2 / 4 / 6 / 8；任意形态都可先化为 4 坏棱再处理。"
            : "Good edge: side color matches its center (like a cross edge). FR tracks 8 edges (no slice). Bad count can be 0/2/4/6/8; any case can be reduced to 4 bad edges first."}
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="2">
          {edgeCases.map((c) => (
            <TutorialCubeStep
              key={c.label}
              title={c.label}
              body={zh ? c.zh : c.en}
              scramble={c.setup}
              emphasis="edges"
              height={120}
            />
          ))}
        </SimpleGrid>
      </Box>

      <Box>
        <Heading size="sm" mb="2">
          {t("fr.tutorial.section.howTo")}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb="3" lineHeight="1.7">
          {zh
            ? "目标：在解决所有坏棱的同时把角形调成 0。先学会单独处理角和棱，再组合。下面以 U/D 轴为例演示关键步骤。"
            : "Goal: fix all bad edges while reaching corner shape 0. Learn corners and edges separately, then combine. Examples below use the U/D axis."}
        </Text>

        <Stack gap="2" mb="4">
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
            {zh ? "单独角块" : "Corners only"}
          </Text>
          <TutorialCubeStep
            title={zh ? "1 角形 → U2" : "Shape 1 → U2"}
            body={
              zh
                ? "上下分离但未对齐，一步轴向半转即可成柱。"
                : "Top and bottom split but misaligned; one axis half-turn aligns the pillars."
            }
            scramble={corner1Setup}
            solution={["U2"]}
            emphasis="corners"
            algLabel="U2"
            showControls
          />
          <TutorialCubeStep
            title={zh ? "2FB → R2 U2" : "2FB → R2 U2"}
            body={
              zh
                ? "先用侧面半转把两角分到上下层，再 U2 对齐。"
                : "Use a side half-turn to split the pair across layers, then U2 to align."
            }
            scramble={corner2FbSetup}
            solution={["R2", "U2"]}
            emphasis="corners"
            algLabel="R2 U2"
            showControls
          />
        </Stack>

        <Stack gap="2" mb="4">
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
            {zh ? "单独棱块（4 坏棱）" : "Edges only (4 bad)"}
          </Text>
          <TutorialCubeStep
            title={zh ? "4-0 → U2" : "4-0 → U2"}
            body={
              zh
                ? "4 个坏棱全在一层时，一步 U2 互换四层棱的好坏。"
                : "When all 4 bad edges sit in one layer, U2 swaps their good/bad status."
            }
            scramble={edge40Setup}
            solution={["U2"]}
            emphasis="edges"
            algLabel="U2"
            showControls
          />
        </Stack>

        <Stack gap="3" mb="2">
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
            {zh ? "简单 Case" : "Simple cases"}
          </Text>
          {simpleCases.map((item) => (
            <TutorialCaseCard key={item.label} item={item} zh={zh} />
          ))}
        </Stack>

        <Stack gap="3" mb="2">
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
            {zh ? "较难 Case" : "Harder cases"}
          </Text>
          {hardCases.map((item) => (
            <TutorialCaseCard key={item.label} item={item} zh={zh} />
          ))}
        </Stack>

        <Stack gap="3">
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
            {zh ? "特殊策略" : "Special strategies"}
          </Text>
          <TutorialCaseCard item={TUTORIAL_SPECIAL_40_0} zh={zh} />
          <Text fontSize="sm" color="fg.muted" lineHeight="1.7" px="1">
            {zh ? tutorialSpecialNotes.zh : tutorialSpecialNotes.en}
          </Text>
        </Stack>
      </Box>

      <Box>
        <Heading size="sm" mb="2">
          {t("fr.tutorial.section.trueFr")}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb="3" lineHeight="1.7">
          {zh
            ? "只把角形和坏棱都做成 0 可能是假 FR：若过程中 U2/D2 总数奇偶不对，形态满足但仍需一个轴向半转。例：还原态做 F R2 F2 R2 F2 R2 F。"
            : "Reaching shape 0 for corners and edges may still be false FR if U2/D2 parity is wrong—you need one more axis half-turn. Example from solved: F R2 F2 R2 F2 R2 F."}
        </Text>
        <TutorialCubeStep
          title={zh ? "假 FR 示例" : "False FR example"}
          body={
            zh
              ? "UD 层角棱形态均满足 FR，但无法仅用 R2 L2 F2 B2 还原。"
              : "U/D corners and edges look like FR, but R2 L2 F2 B2 alone cannot solve it."
          }
          scramble={FALSE_FR_SETUP}
          emphasis="axis"
        />
        <Stack gap="2" mt="3">
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
            {zh ? "奇偶修补" : "Parity fix"}
          </Text>
          <Text fontSize="sm" color="fg.muted" lineHeight="1.7">
            {zh
              ? "在棱角状态为 2-2a / 2 时可插入 U2/D2 而不破坏进度。通用做法：在 FR trigger 处做 [F2 U2 F2] R2 U2。"
              : "At 2-2a / 2 you can insert U2/D2 without breaking progress. General fix at the FR trigger: [F2 U2 F2] R2 U2."}
          </Text>
          <TutorialCubeStep
            title={zh ? "2-2a 态（可插 U2）" : "2-2a state (U2 insert OK)"}
            body={
              zh
                ? "此态下做 U2/D2 不改变棱角分类，适合补奇偶。"
                : "U2/D2 here does not change the edge/corner labels—good for parity."
            }
            scramble={PARITY_INSERT_SETUP}
            emphasis="axis"
          />
          <TutorialCubeStep
            title={zh ? "示范：[F2 U2 F2] R2 U2" : "Demo: [F2 U2 F2] R2 U2"}
            body={
              zh
                ? "从 3-1 / 2FB 出发，插入三步保持 trigger 不变并补足奇偶。"
                : "From 3-1 / 2FB, insert three moves to keep the trigger and fix parity."
            }
            scramble={FR_TRIGGER_SETUP}
            solution={["F2", "U2", "F2", "R2", "U2"]}
            emphasis="axis"
            algLabel="[F2 U2 F2] R2 U2"
            showControls
          />
        </Stack>
      </Box>

      <Box>
        <Heading size="sm" mb="2">
          {t("fr.tutorial.section.tips")}
        </Heading>
        <List.Root fontSize="sm" color="fg.muted" gap="2" pl="4">
          <List.Item>
            {zh
              ? "追求好解（如 sub-25）时，非简单 case 可放弃该 HTR，除非 HTR 步数很少（约 ≤15）。"
              : "Chasing a great solve (e.g. sub-25)? Drop non-simple HTR unless the HTR segment is very short (around ≤15 moves)."}
          </List.Item>
          <List.Item>
            {zh
              ? "公式可换相对面（对称性），FR 后状态可能更优，可多试几种收尾。"
              : "Symmetric algs on opposite faces may leave a better post-FR state—try variants."}
          </List.Item>
          <List.Item>
            {zh
              ? "本工具「正确解（真 FR）」已自动补齐奇偶，可在「解法解析」中对照形态解与真 FR 解。"
              : "This tool's correct (true-FR) solution already fixes parity—compare shape vs true FR in Solution breakdown."}
          </List.Item>
        </List.Root>
      </Box>

      <Box>
        <Heading size="sm" mb="2">
          {t("fr.tutorial.section.video")}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb="2">
          {zh
            ? "更完整的讲解与演示可参考原作者的 B 站专栏："
            : "For a fuller walkthrough, see the author's Bilibili post:"}
        </Text>
        <Button
          asChild
          variant="outline"
          colorPalette={FR_COLORS.palette}
          size="sm"
        >
          <Link href={FR_TUTORIAL_URL} target="_blank" rel="noopener noreferrer">
            {t("fr.tutorial.videoLink")}
          </Link>
        </Button>
      </Box>

      <Box borderTopWidth="1px" pt="4" borderColor={FR_COLORS.border}>
        <Text fontSize="xs" color="fg.muted" lineHeight="1.7">
          {zh ? (
            <>
              本教程内容整理自{" "}
              <Badge colorPalette={FR_COLORS.palette} variant="subtle">
                2014MIAO02
              </Badge>{" "}
              的《【最少步】Floppy Reduction 教程》（编辑于 2024-12-12）。
            </>
          ) : (
            <>
              This tutorial is adapted from{" "}
              <Badge colorPalette={FR_COLORS.palette} variant="subtle">
                2014MIAO02
              </Badge>
              &apos;s &ldquo;Floppy Reduction (Fewest Moves)&rdquo; guide (edited
              2024-12-12).
            </>
          )}
        </Text>
      </Box>
    </Stack>
  );
}
