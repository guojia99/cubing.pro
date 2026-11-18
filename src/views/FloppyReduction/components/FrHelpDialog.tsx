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
import { translateTutorialExtra } from "@/i18n/messages/tutorial-extra";
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
  emphasis,
}: {
  title: string;
  cases: CaseItem[];
  emphasis: "corners" | "edges";
}) {
  const { locale } = useI18n();
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
                {translateTutorialExtra(locale, c.descriptionKey)}
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
          <Dialog.Content className="fr-help-dialog">
            <Dialog.Header>
              <Dialog.Title>{t("fr.help.title")}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="5">
                <Text fontSize="xs" color="fg.muted">
                  {translateTutorialExtra(locale, "tutorialExtra.fr.helpIntro")}
                </Text>
                <CaseSection
                  title={translateTutorialExtra(locale, "tutorialExtra.fr.helpCorners")}
                  cases={cornerCases}
                  emphasis="corners"
                />
                <CaseSection
                  title={translateTutorialExtra(locale, "tutorialExtra.fr.helpEdges")}
                  cases={edgeCases}
                  emphasis="edges"
                />

                <Box>
                  <Heading size="sm" mb="2">
                    {translateTutorialExtra(locale, "tutorialExtra.fr.referenceAlgs")}
                  </Heading>
                  <Table.Root size="sm" variant="outline">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>
                          {translateTutorialExtra(locale, "tutorialExtra.fr.edgeCorner")}
                        </Table.ColumnHeader>
                        <Table.ColumnHeader>{translateTutorialExtra(locale, "tutorialExtra.fr.algorithm")}</Table.ColumnHeader>
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
                    {translateTutorialExtra(locale, "tutorialExtra.fr.trueFalse")}
                  </Heading>
                  <Text fontSize="sm" color="fg.muted">
                    {translateTutorialExtra(locale, "tutorialExtra.fr.false")}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" mt="2">
                    {translateTutorialExtra(locale, "tutorialExtra.fr.helpParity")}
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
