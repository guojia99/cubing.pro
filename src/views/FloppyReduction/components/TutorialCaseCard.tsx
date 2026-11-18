"use client";

import { Badge, Box, Flex, Text } from "@chakra-ui/react";
import dynamic from "next/dynamic";

import { useI18n } from "@/contexts/I18nProvider";
import { translateTutorialExtra } from "@/i18n/messages/tutorial-extra";
import { FR_COLORS } from "@/views/FloppyReduction/utils/constants";
import type { TutorialCaseItem } from "@/views/FloppyReduction/utils/caseData";

const FrCube3D = dynamic(
  () => import("@/views/FloppyReduction/components/FrCube3D").then((m) => m.FrCube3D),
  {
    ssr: false,
    loading: () => (
      <Box display="flex" justifyContent="center" alignItems="center" h="180px" w="180px">
        <Text fontSize="xs" color="fg.muted">
          …
        </Text>
      </Box>
    ),
  },
);

function parseAlg(alg: string): string[] {
  return alg.trim().split(/\s+/).filter(Boolean);
}

export function TutorialCaseCard({
  item,
}: {
  item: TutorialCaseItem;
}) {
  const { locale } = useI18n();
  const solution = parseAlg(item.alg);

  return (
    <Box
      className="fr-tutorial-case"
      borderWidth="1px"
      borderRadius="md"
      p="3"
      bg={FR_COLORS.bgSubtle}
    >
      <Flex gap="2" mb="2" flexWrap="wrap" alignItems="center">
        <Badge
          colorPalette={FR_COLORS.palette}
          fontFamily="mono"
          display="inline-flex"
          alignItems="center"
        >
          {item.label}
        </Badge>
        <Badge
          variant="outline"
          colorPalette="gray"
          display="inline-flex"
          alignItems="center"
        >
          {translateTutorialExtra(locale, `tutorialExtra.fr.tier.${item.tier}`)}
        </Badge>
        <Text
          as="span"
          m="0"
          display="inline-flex"
          alignItems="center"
          fontSize="sm"
          fontFamily="mono"
          fontWeight="bold"
          color={FR_COLORS.accent}
          lineHeight="1"
        >
          {item.alg}
        </Text>
      </Flex>

      <Flex gap="3" align="flex-start" direction={{ base: "column", sm: "row" }}>
        <Box flexShrink={0} w={{ base: "100%", sm: "180px" }}>
          <FrCube3D
            scramble={item.setup}
            solution={solution}
            axisKey="ud"
            height={180}
            showBackView={false}
            emphasis="axis"
            showControls
          />
        </Box>
        <Text fontSize="sm" color="fg.muted" lineHeight="1.7" flex="1">
          {translateTutorialExtra(locale, item.descriptionKey)}
        </Text>
      </Flex>
    </Box>
  );
}
