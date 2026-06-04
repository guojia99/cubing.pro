"use client";

import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  NativeSelect,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { UserCloudKvPanel } from "@/components/UserData/UserCloudKvPanel";
import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import {
  exportPracticeConfig,
  importPracticeConfig,
} from "@/services/cubing-pro/algs/practiceConfigExport";
import {
  getAlgCubeMap,
  type AlgCubeMap,
  type AlgListItem,
} from "@/services/cubing-pro/algs/algs";
import {
  USER_KV_KEYS,
  assertPayloadWithinLimit,
} from "@/services/cubing-pro/user/user_kv";

import AlgsCubeDiagram from "./components/AlgsCubeDiagram";
import RandomPickModal, { RANDOM_PICK_ICON_SVG } from "./components/RandomPickModal";
import SvgRenderer from "./components/SvgRenderer";
import { ALGS_COLORS } from "./utils/constants";

function AlgsSetCard({
  cube,
  item,
  onClick,
}: {
  cube: string;
  item: AlgListItem;
  onClick: () => void;
}) {
  return (
    <Card.Root
      borderRadius="xl"
      cursor="pointer"
      className="algs-card-float"
      bg={ALGS_COLORS.cardBg}
      borderColor={ALGS_COLORS.cardBorder}
      borderWidth="1px"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "lg",
        borderColor: ALGS_COLORS.cardHoverBorder,
      }}
      transition="all 0.2s ease"
      overflow="hidden"
      onClick={onClick}
    >
      <Card.Body p="3">
        <VStack gap="2" align="stretch">
          <Flex
            justify="center"
            align="center"
            minH="130px"
            borderRadius="lg"
            bg={ALGS_COLORS.cardDiagramBg}
            overflow="hidden"
          >
            <AlgsCubeDiagram
              cube={cube}
              classId={item.name}
              setName=""
              groupName=""
              imageSvg={item.image}
              scramble=""
              formula={item.alg}
              useVisualCube
              maxWidth={130}
              maxHeight={130}
            />
          </Flex>
          <Text
            fontWeight="semibold"
            fontSize="sm"
            lineClamp={2}
            textAlign="center"
            color="fg"
            minH="2.5em"
          >
            {item.name}
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

function ToolMiniCard({
  title,
  children,
  onClick,
  interactive,
}: {
  title: string;
  children: ReactNode;
  onClick?: () => void;
  interactive?: boolean;
}) {
  return (
    <Card.Root
      borderRadius="xl"
      bg={ALGS_COLORS.cardBg}
      borderColor={ALGS_COLORS.cardBorder}
      borderWidth="1px"
      h="full"
      cursor={interactive ? "pointer" : undefined}
      className={interactive ? "algs-card-float" : undefined}
      _hover={
        interactive
          ? {
              transform: "translateY(-4px)",
              boxShadow: "lg",
              borderColor: ALGS_COLORS.cardHoverBorder,
            }
          : undefined
      }
      transition="all 0.2s ease"
      onClick={onClick}
    >
      <Card.Body p="4" display="flex" flexDirection="column" gap="3" h="full">
        <Text fontWeight="semibold" fontSize="sm" color="fg">
          {title}
        </Text>
        <Box flex="1">{children}</Box>
      </Card.Body>
    </Card.Root>
  );
}

export function AlgsListView() {
  const { t, tf } = useI18n();
  const router = useRouter();
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loggedIn = !!currentUser?.id;

  const [data, setData] = useState<AlgCubeMap | null>(null);
  const [error, setError] = useState(false);
  const [filterCube, setFilterCube] = useState("");
  const [randomPickModalOpen, setRandomPickModalOpen] = useState(false);

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

  const cubeKeys = data?.CubeKeys ?? [];
  const classMap = data?.ClassMap ?? {};

  const filteredCubes = useMemo(
    () => (filterCube ? [filterCube] : cubeKeys),
    [filterCube, cubeKeys],
  );

  const cubesWithItems = useMemo(
    () =>
      filteredCubes.filter((cube) => (classMap[cube] ?? []).length > 0),
    [filteredCubes, classMap],
  );

  const handleCardClick = useCallback(
    (cube: string, name: string) => {
      router.push(`/algs/${cube}/${encodeURIComponent(name)}`);
    },
    [router],
  );

  const handleExport = useCallback(() => {
    const config = exportPracticeConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `practice-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toaster.create({ title: t("algs.practiceConfig.exportSuccess"), type: "success" });
  }, [t]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const result = importPracticeConfig(text);
      if (result.success) {
        toaster.create({
          title: t("algs.practiceConfig.importSuccess"),
          type: "success",
        });
      } else {
        toaster.create({
          title: tf("algs.practiceConfig.importFailed", {
            msg: result.message ?? "",
          }),
          type: "error",
        });
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  if (error) {
    return (
      <VStack gap="4" py="12">
        <Text color="fg.muted">{t("algs.loadError")}</Text>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap="6">
      <Heading size="xl" color="fg">
        {t("algs.title")}
      </Heading>

      <Flex align="center" gap="3" flexWrap="wrap">
        <NativeSelect.Root maxW={{ base: "full", md: "220px" }} size="sm">
          <NativeSelect.Field
            value={filterCube}
            onChange={(e) => setFilterCube(e.target.value)}
          >
            <option value="">{t("algs.filter.all")}</option>
            {cubeKeys.map((cube) => (
              <option key={cube} value={cube}>
                {cube}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Flex>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={handleFileChange}
      />

      {!data && (
        <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap="4">
          {Array.from({ length: 8 }).map((_, i) => (
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
          <Card.Root
            borderRadius="xl"
            borderColor={ALGS_COLORS.cardBorder}
            borderWidth="1px"
            bg={ALGS_COLORS.sectionBg}
          >
            <Card.Header pb={2}>
              <Heading size="md" color="fg">
                {t("algs.list.toolsSection")}
              </Heading>
            </Card.Header>
            <Card.Body pt={0}>
              <Grid
                templateColumns={{
                  base: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                }}
                gap="4"
              >
                <ToolMiniCard
                  title={t("algs.randomPick.title")}
                  interactive
                  onClick={() => setRandomPickModalOpen(true)}
                >
                  <VStack gap="2" justify="center" minH="100px">
                    <SvgRenderer
                      svg={RANDOM_PICK_ICON_SVG}
                      maxWidth={72}
                      maxHeight={72}
                    />
                    <Text fontSize="xs" color="fg.muted" textAlign="center">
                      {t("algs.randomPick.hintStart")}
                    </Text>
                  </VStack>
                </ToolMiniCard>

                <ToolMiniCard title={t("algs.list.importExportTitle")}>
                  <VStack gap="2" justify="center" h="full">
                    <Text fontSize="xs" color="fg.muted" textAlign="center">
                      {t("algs.list.importExportDesc")}
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      colorPalette="brand"
                      w="full"
                      onClick={handleExport}
                    >
                      {t("algs.practiceConfig.export")}
                    </Button>
                    <Button
                      size="sm"
                      colorPalette="brand"
                      w="full"
                      onClick={handleImportClick}
                    >
                      {t("algs.practiceConfig.import")}
                    </Button>
                  </VStack>
                </ToolMiniCard>

                <ToolMiniCard title={t("algs.cloud.title")}>
                  {loggedIn ? (
                    <UserCloudKvPanel
                      embedded
                      kvKey={USER_KV_KEYS.algorithm_config}
                      description={t("algs.cloud.desc")}
                      uploadButtonText={t("algs.cloud.upload")}
                      syncButtonText={t("algs.cloud.sync")}
                      uploadOkText={t("algs.cloud.uploadOk")}
                      syncOkText={t("algs.cloud.syncOk")}
                      getPayloadForUpload={() => {
                        const raw = JSON.stringify(exportPracticeConfig(), null, 2);
                        assertPayloadWithinLimit(raw);
                        return raw;
                      }}
                      applyCloudPayload={(raw) => {
                        const result = importPracticeConfig(raw);
                        if (!result.success) {
                          throw new Error(result.message ?? "import failed");
                        }
                      }}
                    />
                  ) : (
                    <Text fontSize="xs" color="fg.muted">
                      {t("algs.cloud.loginHint")}
                    </Text>
                  )}
                </ToolMiniCard>
              </Grid>
            </Card.Body>
          </Card.Root>

          {cubesWithItems.length === 0 ? (
            <Box textAlign="center" py="12">
              <Text color="fg.muted">{t("algs.empty")}</Text>
            </Box>
          ) : (
            cubesWithItems.map((cube) => {
              const items = classMap[cube] ?? [];
              return (
                <Card.Root
                  key={cube}
                  borderRadius="xl"
                  borderColor={ALGS_COLORS.cardBorder}
                  borderWidth="1px"
                  bg={ALGS_COLORS.sectionBg}
                >
                  <Card.Header pb={2}>
                    <Heading size="md" color="fg">
                      {cube}
                    </Heading>
                  </Card.Header>
                  <Card.Body pt={0}>
                    <Grid
                      templateColumns="repeat(auto-fill, minmax(180px, 1fr))"
                      gap="4"
                    >
                      {items.map((item) => (
                        <AlgsSetCard
                          key={`${cube}/${item.name}`}
                          cube={cube}
                          item={item}
                          onClick={() => handleCardClick(cube, item.name)}
                        />
                      ))}
                    </Grid>
                  </Card.Body>
                </Card.Root>
              );
            })
          )}

          <RandomPickModal
            open={randomPickModalOpen}
            onClose={() => setRandomPickModalOpen(false)}
            classMap={classMap}
            cubeKeys={filteredCubes}
          />
        </>
      )}

      <style jsx global>{`
        @keyframes algsCardFloat {
          0%,
          100% {
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
