"use client";

import { Box, Flex, Spinner, Text } from "@chakra-ui/react";
import dynamic from "next/dynamic";

import type { FrCubeEmphasis } from "@/views/FloppyReduction/components/FrCube3D";
import { FR_COLORS } from "@/views/FloppyReduction/utils/constants";

const FrCube3D = dynamic(
  () => import("@/views/FloppyReduction/components/FrCube3D").then((m) => m.FrCube3D),
  {
    ssr: false,
    loading: () => (
      <Box display="flex" justifyContent="center" alignItems="center" h="160px" w="160px">
        <Spinner size="sm" />
      </Box>
    ),
  },
);

export interface TutorialCubeStepProps {
  title?: string;
  body: string;
  scramble: string;
  solution?: string[] | null;
  emphasis?: FrCubeEmphasis;
  algLabel?: string;
  height?: number;
}

export function TutorialCubeStep({
  title,
  body,
  scramble,
  solution = null,
  emphasis = "axis",
  algLabel,
  height = 160,
}: TutorialCubeStepProps) {
  return (
    <Flex
      gap="3"
      align="flex-start"
      borderWidth="1px"
      borderRadius="md"
      p="3"
      bg={FR_COLORS.bgSubtle}
    >
      <Box flexShrink="0" w={`${height}px`}>
        <FrCube3D
          scramble={scramble}
          solution={solution}
          axisKey="ud"
          height={height}
          showBackView={false}
          emphasis={emphasis}
        />
      </Box>
      <Box flex="1" minW="0">
        {title && (
          <Text fontSize="sm" fontWeight="semibold" mb="1">
            {title}
          </Text>
        )}
        <Text fontSize="xs" color="fg.muted" lineHeight="1.6">
          {body}
        </Text>
        {algLabel && (
          <Text
            fontSize="sm"
            fontFamily="mono"
            fontWeight="bold"
            color={FR_COLORS.accent}
            mt="2"
          >
            {algLabel}
          </Text>
        )}
      </Box>
    </Flex>
  );
}
