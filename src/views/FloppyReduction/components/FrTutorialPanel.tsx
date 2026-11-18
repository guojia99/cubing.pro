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
import { translateTutorialExtra } from "@/i18n/messages/tutorial-extra";
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

  const corner1Setup = cornerCases.find((c) => c.label === "1")!.setup;
  const corner2FbSetup = cornerCases.find((c) => c.label === "2FB")!.setup;
  const edge40Setup = edgeCases.find((c) => c.label === "4-0")!.setup;
  const simpleCases = tutorialCases.filter((c) => c.tier === "simple");
  const hardCases = tutorialCases.filter((c) => c.tier === "hard");

  return (
    <Stack className="fr-tutorial" gap="6">
      <Box as="section">
        <Heading as="h2" size="sm" mb="2">
          {t("fr.tutorial.section.intro")}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb="3" lineHeight="1.7">
          {translateTutorialExtra(locale, "tutorialExtra.fr.intro")}
        </Text>
        <TutorialCubeStep
          body={translateTutorialExtra(locale, "tutorialExtra.fr.limited")}
          scramble={FR_LIMITED_SCRAMBLE}
          emphasis="axis"
        />
      </Box>

      <Box as="section">
        <Heading as="h2" size="sm" mb="2">
          {t("fr.tutorial.section.corners")}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb="3" lineHeight="1.7">
          {translateTutorialExtra(locale, "tutorialExtra.fr.corners")}
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="2">
          {cornerCases.map((c) => (
            <TutorialCubeStep
              key={c.label}
              title={c.label}
              body={translateTutorialExtra(locale, c.descriptionKey)}
              scramble={c.setup}
              emphasis="corners"
              height={120}
            />
          ))}
        </SimpleGrid>
      </Box>

      <Box as="section">
        <Heading as="h2" size="sm" mb="2">
          {t("fr.tutorial.section.edges")}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb="3" lineHeight="1.7">
          {translateTutorialExtra(locale, "tutorialExtra.fr.edges")}
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="2">
          {edgeCases.map((c) => (
            <TutorialCubeStep
              key={c.label}
              title={c.label}
              body={translateTutorialExtra(locale, c.descriptionKey)}
              scramble={c.setup}
              emphasis="edges"
              height={120}
            />
          ))}
        </SimpleGrid>
      </Box>

      <Box as="section">
        <Heading as="h2" size="sm" mb="2">
          {t("fr.tutorial.section.howTo")}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb="3" lineHeight="1.7">
          {translateTutorialExtra(locale, "tutorialExtra.fr.goal")}
        </Text>

        <Stack gap="2" mb="4">
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
            {translateTutorialExtra(locale, "tutorialExtra.fr.cornersOnly")}
          </Text>
          <TutorialCubeStep
            title={translateTutorialExtra(locale, "tutorialExtra.fr.shape1Title")}
            body={translateTutorialExtra(locale, "tutorialExtra.fr.corner.1")}
            scramble={corner1Setup}
            solution={["U2"]}
            emphasis="corners"
            algLabel="U2"
            showControls
          />
          <TutorialCubeStep
            title="2FB → R2 U2"
            body={translateTutorialExtra(locale, "tutorialExtra.fr.splitPair")}
            scramble={corner2FbSetup}
            solution={["R2", "U2"]}
            emphasis="corners"
            algLabel="R2 U2"
            showControls
          />
        </Stack>

        <Stack gap="2" mb="4">
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
            {translateTutorialExtra(locale, "tutorialExtra.fr.edgesOnly")}
          </Text>
          <TutorialCubeStep
            title="4-0 → U2"
            body={translateTutorialExtra(locale, "tutorialExtra.fr.flipEdges")}
            scramble={edge40Setup}
            solution={["U2"]}
            emphasis="edges"
            algLabel="U2"
            showControls
          />
        </Stack>

        <Stack gap="3" mb="2">
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
            {translateTutorialExtra(locale, "tutorialExtra.fr.simpleCases")}
          </Text>
          {simpleCases.map((item) => (
            <TutorialCaseCard key={item.label} item={item} />
          ))}
        </Stack>

        <Stack gap="3" mb="2">
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
            {translateTutorialExtra(locale, "tutorialExtra.fr.hardCases")}
          </Text>
          {hardCases.map((item) => (
            <TutorialCaseCard key={item.label} item={item} />
          ))}
        </Stack>

        <Stack gap="3">
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
            {translateTutorialExtra(locale, "tutorialExtra.fr.strategies")}
          </Text>
          <TutorialCaseCard item={TUTORIAL_SPECIAL_40_0} />
          <Text fontSize="sm" color="fg.muted" lineHeight="1.7" px="1">
            {translateTutorialExtra(locale, tutorialSpecialNotes)}
          </Text>
        </Stack>
      </Box>

      <Box as="section">
        <Heading as="h2" size="sm" mb="2">
          {t("fr.tutorial.section.trueFr")}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb="3" lineHeight="1.7">
          {translateTutorialExtra(locale, "tutorialExtra.fr.false")}
        </Text>
        <TutorialCubeStep
          title={translateTutorialExtra(locale, "tutorialExtra.fr.falseTitle")}
          body={translateTutorialExtra(locale, "tutorialExtra.fr.falseBody")}
          scramble={FALSE_FR_SETUP}
          emphasis="axis"
        />
        <Stack gap="2" mt="3">
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
            {translateTutorialExtra(locale, "tutorialExtra.fr.parityTitle")}
          </Text>
          <Text fontSize="sm" color="fg.muted" lineHeight="1.7">
            {translateTutorialExtra(locale, "tutorialExtra.fr.parity")}
          </Text>
          <TutorialCubeStep
            title={translateTutorialExtra(locale, "tutorialExtra.fr.insertTitle")}
            body={translateTutorialExtra(locale, "tutorialExtra.fr.insertBody")}
            scramble={PARITY_INSERT_SETUP}
            emphasis="axis"
          />
          <TutorialCubeStep
            title={translateTutorialExtra(locale, "tutorialExtra.fr.demoTitle")}
            body={translateTutorialExtra(locale, "tutorialExtra.fr.demoBody")}
            scramble={FR_TRIGGER_SETUP}
            solution={["F2", "U2", "F2", "R2", "U2"]}
            emphasis="axis"
            algLabel="[F2 U2 F2] R2 U2"
            showControls
          />
        </Stack>
      </Box>

      <Box as="section">
        <Heading as="h2" size="sm" mb="2">
          {t("fr.tutorial.section.tips")}
        </Heading>
        <List.Root fontSize="sm" color="fg.muted" gap="2" pl="4">
          <List.Item>
            {translateTutorialExtra(locale, "tutorialExtra.fr.tipShort")}
          </List.Item>
          <List.Item>
            {translateTutorialExtra(locale, "tutorialExtra.fr.tipSymmetry")}
          </List.Item>
          <List.Item>
            {translateTutorialExtra(locale, "tutorialExtra.fr.tipTool")}
          </List.Item>
        </List.Root>
      </Box>

      <Box>
        <Heading size="sm" mb="2">
          {t("fr.tutorial.section.video")}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb="2">
          {translateTutorialExtra(locale, "tutorialExtra.fr.videoIntro")}
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
          {translateTutorialExtra(locale, "tutorialExtra.fr.creditBefore")}
          <Badge colorPalette={FR_COLORS.palette} variant="subtle">
            2014MIAO02
          </Badge>
          {translateTutorialExtra(locale, "tutorialExtra.fr.creditAfter")}
        </Text>
      </Box>
    </Stack>
  );
}
