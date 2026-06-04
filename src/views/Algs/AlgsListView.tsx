"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Separator,
  Skeleton,
  Switch, // kept for namespace
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/contexts/I18nProvider";
import {
  getAlgCubeMap,
  type AlgCubeMap,
  type AlgListItem,
} from "@/services/cubing-pro/algs/algs";
import AlgsCubeDiagram from "./components/AlgsCubeDiagram";
import {
  getUseVisualCubeRenderer,
  setUseVisualCubeRenderer,
} from "./utils/storage";
import { isVisualCubeCube } from "./utils/visualCubeCube";
import { ALGS_COLORS } from "./utils/constants";
import { exportPracticeConfig } from "@/services/cubing-pro/algs/practiceConfigExport";

export function AlgsListView() {
  const { t } = useI18n();
  const router = useRouter();
  const [data, setData] = useState<AlgCubeMap | null>(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCube, setSelectedCube] = useState<string | null>(null);
  const [useVisualCube, setUseVisualCube] = useState(true);

  useEffect(() => {
    setUseVisualCube(getUseVisualCubeRenderer());
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAlgCubeMap()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleVisualCube = useCallback(() => {
    const next = !useVisualCube;
    setUseVisualCube(next);
    setUseVisualCubeRenderer(next);
  }, [useVisualCube]);

  const visibleCubes = useMemo(() => {
    if (!data) return [];
    let cubes = data.CubeKeys;
    if (selectedCube) {
      cubes = cubes.filter((c) => c === selectedCube);
    }
    return cubes;
  }, [data, selectedCube]);

  const filteredMap = useMemo(() => {
    if (!data) return {} as Record<string, AlgListItem[]>;
    const map: Record<string, AlgListItem[]> = {};
    for (const cube of visibleCubes) {
      let items = data.ClassMap[cube] ?? [];
      if (search.trim()) {
        const q = search.toLowerCase();
        items = items.filter((item) =>
          item.name.toLowerCase().includes(q),
        );
      }
      if (items.length > 0) {
        map[cube] = items;
      }
    }
    return map;
  }, [data, visibleCubes, search]);

  const handleCardClick = useCallback(
    (cube: string, name: string) => {
      router.push(`/algs/${cube}/${encodeURIComponent(name)}`);
    },
    [router],
  );

  const handleExport = useCallback(() => {
    if (!data) return;
    const allKeys: string[] = [];
    for (const cube of data.CubeKeys) {
      const items = data.ClassMap[cube] ?? [];
      for (const item of items) {
        allKeys.push(`${cube}_${item.name}`);
      }
    }
    const json = exportPracticeConfig("__all__", "__all__", allKeys);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cubing-practice-config.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  if (error) {
    return (
      <VStack gap="4" py="12">
        <Text color="fg.muted">{t("algs.loadError")}</Text>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap="6">
      <Flex justify="space-between" align="center" flexWrap="wrap" gap="4">
        <Heading size="xl" color="teal.600">
          {t("algs.title")}
        </Heading>
        <HStack gap="3">
          <Text fontSize="sm" color="fg.muted">
            VisualCube
          </Text>
          <Switch.Root
            size="sm"
            checked={useVisualCube}
            onCheckedChange={handleToggleVisualCube}
            colorPalette="teal"
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </HStack>
      </Flex>

      <Flex
        direction={{ base: "column", md: "row" }}
        gap="3"
        align={{ base: "stretch", md: "center" }}
        flexWrap="wrap"
      >
        <Input
          placeholder={t("algs.search")}
          maxW={{ base: "full", md: "280px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          borderColor="teal.300"
          _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px var(--chakra-colors-teal-500)" }}
          size="sm"
          borderRadius="lg"
        />
        <HStack gap="2" flexWrap="wrap">
          <Badge
            as="button"
            cursor="pointer"
            onClick={() => setSelectedCube(null)}
            variant={selectedCube === null ? "solid" : "outline"}
            colorPalette="teal"
            borderRadius="full"
            px="3"
            py="1"
            fontSize="sm"
            _hover={{ opacity: 0.85 }}
          >
            {t("algs.allCubes")}
          </Badge>
          {data?.CubeKeys.map((cube) => (
            <Badge
              key={cube}
              as="button"
              cursor="pointer"
              onClick={() =>
                setSelectedCube(selectedCube === cube ? null : cube)
              }
              variant={selectedCube === cube ? "solid" : "outline"}
              colorPalette="teal"
              borderRadius="full"
              px="3"
              py="1"
              fontSize="sm"
              _hover={{ opacity: 0.85 }}
            >
              {cube}
            </Badge>
          ))}
        </HStack>
        <Button
          size="sm"
          variant="outline"
          colorPalette="teal"
          borderRadius="lg"
          onClick={handleExport}
          ml="auto"
        >
          {t("algs.practiceConfig.export")}
        </Button>
      </Flex>

      {!data && (
        <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap="4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card.Root key={i} borderRadius="xl">
              <Card.Body p="4">
                <Skeleton height="120px" mb="3" borderRadius="lg" />
                <Skeleton height="14px" width="70%" />
              </Card.Body>
            </Card.Root>
          ))}
        </Grid>
      )}

      {data && (
        <>
          <Grid
            templateColumns="repeat(auto-fill, minmax(180px, 1fr))"
            gap="4"
          >
            <Card.Root
              borderRadius="xl"
              cursor="pointer"
              className="algs-card-float"
              bg="linear-gradient(135deg, rgba(34,168,203,0.12) 0%, rgba(45,148,176,0.08) 100%)"
              borderColor={ALGS_COLORS.cardBorder}
              borderWidth="1px"
              _hover={{
                transform: "translateY(-4px)",
                boxShadow: "lg",
                borderColor: "teal.400",
              }}
              transition="all 0.2s ease"
              overflow="hidden"
            >
              <Card.Body p="4">
                <VStack gap="3" align="center" justify="center" minH="140px">
                  <Text fontSize="4xl" lineHeight="1">
                    🎲
                  </Text>
                  <Text
                    fontWeight="bold"
                    fontSize="md"
                    color="teal.600"
                    textAlign="center"
                  >
                    Random Pick
                  </Text>
                </VStack>
              </Card.Body>
            </Card.Root>

            {visibleCubes.map((cube) => {
              const items = filteredMap[cube];
              if (!items) return null;
              return items.map((item) => (
                <Card.Root
                  key={`${cube}/${item.name}`}
                  borderRadius="xl"
                  cursor="pointer"
                  className="algs-card-float"
                  bg={ALGS_COLORS.cardBg}
                  borderColor={ALGS_COLORS.cardBorder}
                  borderWidth="1px"
                  _hover={{
                    transform: "translateY(-4px)",
                    boxShadow: "lg",
                    borderColor: "teal.400",
                  }}
                  transition="all 0.2s ease"
                  overflow="hidden"
                  onClick={() => handleCardClick(cube, item.name)}
                >
                  <Card.Body p="3">
                    <VStack gap="2" align="stretch">
                      <Flex
                        justify="center"
                        align="center"
                        minH="130px"
                        borderRadius="lg"
                        bg="whiteAlpha.600"
                        overflow="hidden"
                      >
                        {isVisualCubeCube(cube) ? (
                          <AlgsCubeDiagram
                            cube={cube}
                            classId={item.name}
                            setName=""
                            groupName=""
                            imageSvg={item.image}
                            scramble=""
                            formula={item.alg}
                            useVisualCube={useVisualCube}
                            maxWidth={130}
                            maxHeight={130}
                          />
                        ) : item.image ? (
                          <AlgsCubeDiagram
                            cube={cube}
                            classId={item.name}
                            setName=""
                            groupName=""
                            imageSvg={item.image}
                            useVisualCube={false}
                            maxWidth={130}
                            maxHeight={130}
                          />
                        ) : (
                          <Text fontSize="3xl" color="teal.300">
                            ◇
                          </Text>
                        )}
                      </Flex>
                      <Text
                        fontWeight="semibold"
                        fontSize="sm"
                        lineClamp={2}
                        textAlign="center"
                        color="gray.700"
                        minH="2.5em"
                      >
                        {item.name}
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              ));
            })}
          </Grid>

          {!selectedCube &&
            data.CubeKeys.length > 1 &&
            visibleCubes.map((cube, idx) => {
              const items = filteredMap[cube];
              if (!items || items.length === 0) return null;
              return (
                <Box key={`sep-${cube}`}>
                  {idx > 0 && <Separator />}
                </Box>
              );
            })}
        </>
      )}

      {data && Object.keys(filteredMap).length === 0 && (
        <Box textAlign="center" py="12">
          <Text color="fg.muted">{t("algs.noData")}</Text>
        </Box>
      )}

      <style jsx global>{`
        @keyframes algsCardFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        .algs-card-float {
          animation: algsCardFloat 3s ease-in-out infinite;
        }
        .algs-card-float:hover {
          animation: none;
        }
      `}</style>
    </VStack>
  );
}
