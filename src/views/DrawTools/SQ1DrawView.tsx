"use client";

import {
  Box,
  Flex,
  Grid,
  Input,
  Slider,
  Switch,
  Text,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { toaster } from "@/components/ui/toaster";
import { useI18n } from "@/contexts/I18nProvider";
import {
  DrawActionButton,
  DrawControlField,
  DrawMutedButton,
  DrawSelect,
} from "@/views/DrawTools/components/DrawControls";
import { DrawNavTabs } from "@/views/DrawTools/components/DrawNavTabs";
import { DrawPalette } from "@/views/DrawTools/components/DrawPalette";
import type { PathSvg } from "@/views/DrawTools/types";

const DOUBLE_SQ_TEXT_SIZE = 6;

const cspMap = new Map([
  ["星 Star", "cccccc"],
  ["风筝 Kite", "ececcece"],
  ["方 Square", "ecececec"],
  ["贝壳 Scallop", "eeccccee"],
  ["蘑菇 Mushroom", "ecceccee"],
  ["右爪 R Paw", "eecccece"],
  ["左爪 L Paw", "ececccee"],
  ["右拳 R Fist", "ececceec"],
  ["左拳 L Fist", "ceeccece"],
  ["盾 Shield", "eeccceec"],
  ["桶 Barrel", "ceecceec"],
  ["对 Twins", "cceeccc"],
  ["8", "eeeecceeee"],
  ["71", "eeececeeee"],
  ["62", "eeeceeceee"],
  ["53", "eeceeeceee"],
  ["44", "eeceeeecee"],
  ["6", "eeccceeee"],
  ["51R", "eeeeccece"],
  ["51L", "ececceeee"],
  ["411", "ecececeee"],
  ["42R", "eeeecceec"],
  ["42L", "ceecceeee"],
  ["33", "eeeceeecc"],
  ["321", "ececeeece"],
  ["312", "eeececeec"],
  ["222", "ceeceecee"],
  ["L", "cececcc"],
  ["I", "ecceccc"],
]);

const lineSvgs = "M 44.84834 1.38492 L 25.17810 74.79528";

const cornerSvgs = [
  "m35.01322,38.09014l-5.1493,-19.21651l-14.06721,0l0,14.06721l19.21651,5.1493z",
  "m15.79671,18.87363l-4.8037,-4.8037l17.58351,0l1.2874,4.8037l-14.06721,0z",
  "m15.79671,18.87363l-4.8037,-4.8037l0,17.58351l4.8037,1.2874l0,-14.06721z",
];

const cornerFontPoint = [21.94057, 27.84965];
const edgeFontPoint = [33.4, 27.84965];

const edgeSvgs = [
  "m35.01322,38.09014l5.1485,-19.21651l-10.2978,0l5.1493,19.21651z",
  "m40.16172,18.87363l1.2874,-4.8037l-12.8726,0l1.2874,4.8037l10.2978,0z",
];

const rotatePoint = "35.01322 38.0901";

const baseMinxColor = [
  "#00000000",
  "#033fff",
  "#f3ff00",
  "#d10707",
  "#206606",
  "#ff8806",
  "#3d3d3d",
  "#f5f3db",
  "#777",
];

type SelectOption = { value: string; label: string };

function SimpleSq1Draw() {
  const { t } = useI18n();
  const [num, setNum] = useState(0);
  const [corner, setCorner] = useState(0);
  const [edge, setEdge] = useState(0);
  const [reg, setReg] = useState(0);
  const [baseReg, setBaseReg] = useState(0);
  const [svgPoints, setSvgPoints] = useState<PathSvg[]>([]);
  const [linePoint, setLinePoint] = useState<PathSvg[]>([]);
  const [cubes, setCubes] = useState<string[]>([]);
  const [cpsOpt, setCpsOpt] = useState<SelectOption[]>([]);
  const [defaultVal, setDefaultVal] = useState("");
  const [axisLine, setAxisLine] = useState("30");

  const addEdge = () => {
    if (reg + 30 > 360) {
      toaster.create({
        title: t("draws.sq1.error1.Available_full"),
        type: "warning",
      });
      return;
    }
    if (edge >= 8) {
      toaster.create({
        title: t("draws.sq1.error2.full_edge"),
        type: "warning",
      });
      return;
    }

    setSvgPoints((prev) => [
      ...prev,
      ...edgeSvgs.map((d, i) => ({
        key: `edge${num}_${i}`,
        d,
        baseRotate: reg + 30,
        rotate: baseReg,
        rotatePoint,
      })),
    ]);
    setNum((n) => n + 1);
    setReg((r) => r + 30);
    setEdge((e) => e + 1);
    setCubes((c) => [...c, "edge"]);
  };

  const addCorner = () => {
    if (reg + 60 > 360) {
      toaster.create({
        title: t("draws.sq1.error1.Available_full"),
        type: "warning",
      });
      return;
    }
    if (corner >= 6) {
      toaster.create({
        title: t("draws.sq1.error3.full_corner"),
        type: "warning",
      });
      return;
    }

    setSvgPoints((prev) => [
      ...prev,
      ...cornerSvgs.map((d, i) => ({
        key: `corner${num}_${i}`,
        d,
        baseRotate: reg + 90,
        rotate: baseReg,
        rotatePoint,
      })),
    ]);
    setNum((n) => n + 1);
    setReg((r) => r + 60);
    setCorner((c) => c + 1);
    setCubes((c) => [...c, "corner"]);
  };

  const reset = () => {
    setReg(0);
    setEdge(0);
    setCorner(0);
    setSvgPoints([]);
    setCubes([]);
    setDefaultVal("");
  };

  const resetBaseReg = (value: number) => {
    setBaseReg(value);
    setSvgPoints((points) => points.map((p) => ({ ...p, rotate: value })));
  };

  const removeHandler = () => {
    if (cubes.length === 0) {
      toaster.create({
        title: t("draws.sq1.error4.not_available_delete"),
        type: "warning",
      });
      return;
    }

    const last = cubes[cubes.length - 1];
    if (last === "edge") {
      setReg((r) => r - 30);
      setEdge((e) => e - 1);
      setSvgPoints((p) => p.slice(0, -2));
    } else if (last === "corner") {
      setReg((r) => r - 60);
      setCorner((c) => c - 1);
      setSvgPoints((p) => p.slice(0, -3));
    }
    setCubes((c) => c.slice(0, -1));
    setDefaultVal("");
  };

  const resetLineReg = (value: number) => {
    setAxisLine(String(value));
    switch (value) {
      case 30:
        setLinePoint([{ key: "sq1_line", d: lineSvgs }]);
        return;
      case -30:
        setLinePoint([
          {
            key: "sq1_line",
            d: lineSvgs,
            rotatePoint,
            rotate: 0,
            baseRotate: -30,
          },
        ]);
        return;
      case 0:
        setLinePoint([]);
        return;
    }
  };

  const setDefault = useCallback(
    (preset: string) => {
      const v = cspMap.get(preset);
      if (!v) return;

      const newSvgPoints: PathSvg[] = [];
      let curReg = 0;
      let curEdge = 0;
      let curCorner = 0;
      const curCubes: string[] = [];
      let curNum = num;

      for (let i = 0; i < v.length; i++) {
        const d = v[i];
        if (d === "e") {
          for (let j = 0; j < edgeSvgs.length; j++) {
            newSvgPoints.push({
              key: `edge${curNum}_${j}`,
              d: edgeSvgs[j],
              baseRotate: curReg + 30,
              rotate: baseReg,
              rotatePoint,
            });
          }
          curReg += 30;
          curEdge += 1;
          curCubes.push("edge");
        } else {
          for (let j = 0; j < cornerSvgs.length; j++) {
            newSvgPoints.push({
              key: `corner${curNum}_${j}`,
              d: cornerSvgs[j],
              baseRotate: curReg + 90,
              rotate: baseReg,
              rotatePoint,
            });
          }
          curReg += 60;
          curCorner += 1;
          curCubes.push("corner");
        }
        curNum += 1;
      }

      setReg(curReg);
      setSvgPoints(newSvgPoints);
      setEdge(curEdge);
      setCorner(curCorner);
      setCubes(curCubes);
      setNum(curNum);
      setDefaultVal(preset);
    },
    [baseReg, num],
  );

  useEffect(() => {
    resetLineReg(30);
    const opt: SelectOption[] = [
      { value: "", label: `- ${t("draws.sq1.None")} -` },
    ];
    cspMap.forEach((_value, key) => {
      opt.push({ value: key, label: key });
    });
    setCpsOpt(opt);
    setDefault("星 Star");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount init
  }, []);

  const allSvgPoints = useMemo(
    () => [...linePoint, ...svgPoints],
    [linePoint, svgPoints],
  );

  return (
    <DrawPalette
      svgPoints={allSvgPoints}
      presetColors={baseMinxColor}
      storageKey="sq1Draw"
      viewBox="0 0 75 75"
      strokeWidthNum={0.2}
      buttons={
        <Box>
          <Box textAlign="center" w={{ base: "full", sm: "50%" }} mx="auto" mb="4" minW="0">
            <Text fontSize="xs" fontWeight="medium" color="fg.muted" mb="2">
              {t("draws.sq1.Rotate")}
            </Text>
            <Slider.Root
              min={0}
              max={180}
              step={30}
              value={[baseReg]}
              onValueChange={(details) => resetBaseReg(details.value[0] ?? 0)}
            >
              <Slider.Control>
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumb index={0} />
              </Slider.Control>
            </Slider.Root>
          </Box>

          <Grid
            templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }}
            gap="3"
            mb="4"
            maxW="480px"
            mx="auto"
          >
            <DrawControlField label={t("draws.sq1.Central_axis")}>
              <DrawSelect
                value={axisLine}
                onChange={(v) => resetLineReg(Number(v))}
                w={{ base: "full", sm: "108px" }}
              >
                <option value="0">{t("draws.sq1.None")}</option>
                <option value="30">{t("draws.sq1.Positive_15")}</option>
                <option value="-30">{t("draws.sq1.Negative_15")}</option>
              </DrawSelect>
            </DrawControlField>

            <DrawControlField label={t("draws.sq1.Default")}>
              <DrawSelect
                value={defaultVal}
                onChange={setDefault}
                w={{ base: "full", sm: "148px" }}
              >
                {cpsOpt.map((opt) => (
                  <option key={opt.value || "none"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </DrawSelect>
            </DrawControlField>
          </Grid>

          <Flex gap="1.5" flexWrap="wrap" justify="center">
            <DrawMutedButton onClick={reset} disabled={cubes.length === 0}>
              {t("draws.reset")}
            </DrawMutedButton>
            <DrawMutedButton onClick={removeHandler} disabled={cubes.length === 0}>
              {t("draws.delete")}
            </DrawMutedButton>
            <DrawActionButton
              onClick={addCorner}
              disabled={!(corner < 6 && reg + 60 <= 360)}
            >
              {t("draws.sq1.add_corner")}
            </DrawActionButton>
            <DrawActionButton
              onClick={addEdge}
              disabled={!(edge < 8 && reg + 30 <= 360)}
            >
              {t("draws.sq1.add_edge")}
            </DrawActionButton>
          </Flex>
        </Box>
      }
    />
  );
}

function DoubleSq1Draw() {
  const { t } = useI18n();
  const [topReg, setTopReg] = useState(0);
  const [svgPointsTop, setSvgPointsTop] = useState<PathSvg[]>([]);
  const [linePointTop, setLinePointTop] = useState<PathSvg[]>([]);
  const [topCspOption, setTopCspOptions] = useState<SelectOption[]>([]);
  const [topAxisLine, setTopAxisLine] = useState("30");

  const [downReg, setDownReg] = useState(0);
  const [downDefaultVal, setDownDefaultVal] = useState("");
  const [svgPointsDown, setSvgPointsDown] = useState<PathSvg[]>([]);
  const [linePointDown, setLinePointDown] = useState<PathSvg[]>([]);
  const [downCspOption, setDownCspOptions] = useState<SelectOption[]>([]);
  const [downAxisLine, setDownAxisLine] = useState("-30");

  const [useFont, setUseFont] = useState(false);
  const [fontsTop, setFontsTop] = useState<string[]>([]);
  const [fontsDown, setFontsDown] = useState<string[]>([]);
  const [topPreset, setTopPreset] = useState("星 Star");

  const handleSetFontSwitch = (showFont: boolean) => {
    setUseFont(showFont);
    setSvgPointsTop((points) =>
      points.map((v) =>
        v.key.includes("fonts_")
          ? { ...v, disShow: !showFont, textSize: DOUBLE_SQ_TEXT_SIZE }
          : v,
      ),
    );
    setSvgPointsDown((points) =>
      points.map((v) =>
        v.key.includes("fonts_")
          ? { ...v, disShow: !showFont, textSize: DOUBLE_SQ_TEXT_SIZE }
          : v,
      ),
    );
  };

  const handleTopFontChange = (index: number, value: string) => {
    setFontsTop((fonts) => {
      const next = [...fonts];
      next[index] = value;
      return next;
    });
    const key = `_top_${index}_disable`;
    setSvgPointsTop((points) =>
      points.map((v) => {
        if (!v.key.includes("fonts_")) return v;
        if (v.key.includes(key)) {
          return { ...v, text: value, textSize: DOUBLE_SQ_TEXT_SIZE };
        }
        return v;
      }),
    );
  };

  const handleDownFontChange = (index: number, value: string) => {
    setFontsDown((fonts) => {
      const next = [...fonts];
      next[index] = value;
      return next;
    });
    const key = `_down_${index}_disable`;
    setSvgPointsDown((points) =>
      points.map((v) => {
        if (!v.key.includes("fonts_")) return v;
        if (v.key.includes(key)) {
          return { ...v, text: value, textSize: DOUBLE_SQ_TEXT_SIZE };
        }
        return v;
      }),
    );
  };

  const applyDraws = useCallback(
    (preset: string, topDown: "top" | "down"): [number, number] | undefined => {
      const v = cspMap.get(preset);
      if (!v) return undefined;

      const newSvgPoints: PathSvg[] = [];
      let curEdge = 0;
      let curCorner = 0;
      const timestamp = Date.now();
      const baseReg = topDown === "top" ? topReg : downReg;
      const translate = topDown === "top" ? undefined : [0, 75];

      let curReg = 0;
      const fonts: string[] = [];

      for (let i = 0; i < v.length; i++) {
        const d = v[i];
        const font = `${i}`.toUpperCase();
        const textSize = DOUBLE_SQ_TEXT_SIZE;
        const fontKey = `fonts_${timestamp}_${topDown}_${i}_disable`;

        if (d === "e") {
          for (let j = 0; j < edgeSvgs.length; j++) {
            newSvgPoints.push({
              key: `${timestamp}_edge_${topDown}_${i}_${j}_${curReg}`,
              unColorBindKey: j === 0 ? `sq1DrawDouble-${fontKey}` : undefined,
              d: edgeSvgs[j],
              baseRotate: curReg + 30,
              rotate: baseReg,
              rotatePoint,
              translate,
            });
          }
          newSvgPoints.push({
            disShow: !useFont,
            key: fontKey,
            baseRotate: curReg + 30,
            rotate: baseReg,
            rotatePoint,
            translate,
            text: font,
            textPoint: edgeFontPoint,
            textSize,
            textRouteResetPoint: [1.7, -2.5],
          });
          curReg += 30;
          curEdge += 1;
        } else {
          for (let j = 0; j < cornerSvgs.length; j++) {
            newSvgPoints.push({
              key: `${timestamp}_corner_${topDown}_${i}_${j}_${curReg}`,
              unColorBindKey: j === 0 ? `sq1DrawDouble-${fontKey}` : undefined,
              d: cornerSvgs[j],
              baseRotate: curReg + 90,
              rotate: baseReg,
              rotatePoint,
              translate,
            });
          }
          newSvgPoints.push({
            disShow: !useFont,
            key: fontKey,
            baseRotate: curReg + 90,
            rotate: baseReg,
            rotatePoint,
            translate,
            text: font,
            textPoint: cornerFontPoint,
            textSize,
            textRouteResetPoint: [1.7, -2.5],
          });
          curReg += 60;
          curCorner += 1;
        }
        fonts.push(font);
      }

      if (topDown === "top") {
        setSvgPointsTop(newSvgPoints);
        setFontsTop(fonts);
        return [curEdge, curCorner];
      }
      setSvgPointsDown(newSvgPoints);
      setFontsDown(fonts);
      return undefined;
    },
    [downReg, topReg, useFont],
  );

  const resetLineReg = (value: number, top: boolean) => {
    if (top) setTopAxisLine(String(value));
    else setDownAxisLine(String(value));

    let line: PathSvg = { key: "sq1_line_top" };
    switch (value) {
      case 30:
        line = { key: "sq1_line_top", d: lineSvgs };
        break;
      case -30:
        line = {
          key: "sq1_line_top",
          d: lineSvgs,
          rotatePoint,
          rotate: 0,
          baseRotate: -30,
        };
        break;
      default:
        if (top) setLinePointTop([]);
        else setLinePointDown([]);
        return;
    }

    if (!top) {
      line = { ...line, key: "sq1_line_down", translate: [0, 75] };
      setLinePointDown([line]);
      return;
    }
    setLinePointTop([line]);
  };

  const handleUpdateTopOpt = (preset: string) => {
    setTopPreset(preset);
    const result = applyDraws(preset, "top");
    if (!result) return;
    const [curE, curC] = result;
    const wantE = 8 - curE;
    const wantC = 8 - curC;
    const opt: SelectOption[] = [];
    cspMap.forEach((value, key) => {
      const eCount = value.split("e").length - 1;
      const cCount = value.split("c").length - 1;
      if (eCount === wantE && cCount === wantC) {
        opt.push({ value: key, label: key });
      }
    });
    setDownCspOptions(opt);
    setSvgPointsDown([]);
    const first = opt[0]?.value;
    if (first) {
      setDownDefaultVal(first);
      applyDraws(first, "down");
    }
  };

  const handleUpdateDownOpt = (preset: string) => {
    applyDraws(preset, "down");
    setDownDefaultVal(preset);
  };

  const resetBaseReg = (value: number, topDown: "top" | "down") => {
    if (topDown === "top") {
      setTopReg(value);
      setSvgPointsTop((points) => points.map((p) => ({ ...p, rotate: value })));
    } else {
      setDownReg(value);
      setSvgPointsDown((points) => points.map((p) => ({ ...p, rotate: value })));
    }
  };

  useEffect(() => {
    resetLineReg(30, true);
    resetLineReg(-30, false);

    const opt: SelectOption[] = [];
    cspMap.forEach((_value, key) => {
      opt.push({ value: key, label: key });
    });
    setTopCspOptions(opt);
    setDownDefaultVal("8");

    applyDraws("星 Star", "top");
    applyDraws("8", "down");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount init
  }, []);

  const allSvgPoints = useMemo(
    () => [...linePointTop, ...linePointDown, ...svgPointsTop, ...svgPointsDown],
    [linePointTop, linePointDown, svgPointsTop, svgPointsDown],
  );

  return (
    <DrawPalette
      width={300}
      height={600}
      svgPoints={allSvgPoints}
      presetColors={baseMinxColor}
      storageKey="sq1DrawDouble"
      viewBox="0 0 75 150"
      strokeWidthNum={0.2}
      buttons={
        <>
          <Flex gap="3" align="center" mb="4">
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
              文字
            </Text>
            <Switch.Root
              checked={useFont}
              onCheckedChange={(e) => handleSetFontSwitch(e.checked === true)}
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </Flex>

          <Grid
            templateColumns={{ base: "1fr", md: "repeat(3, minmax(0, 1fr))" }}
            gap="3"
            alignItems="end"
            mb="4"
          >
            <DrawControlField label="顶层">
              <DrawSelect value={topPreset} onChange={handleUpdateTopOpt}>
                {topCspOption.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </DrawSelect>
            </DrawControlField>

            <DrawControlField label="中轴线">
              <DrawSelect
                value={topAxisLine}
                onChange={(v) => resetLineReg(Number(v), true)}
                w={{ base: "full", sm: "108px" }}
              >
                <option value="0">{t("draws.sq1.None")}</option>
                <option value="30">{t("draws.sq1.Positive_15")}</option>
                <option value="-30">{t("draws.sq1.Negative_15")}</option>
              </DrawSelect>
            </DrawControlField>

            <Box minW="0">
              <Text fontSize="xs" fontWeight="medium" color="fg.muted" mb="1.5">
                {t("draws.sq1.Rotate")}
              </Text>
              <Slider.Root
                min={0}
                max={180}
                step={30}
                value={[topReg]}
                onValueChange={(details) =>
                  resetBaseReg(details.value[0] ?? 0, "top")
                }
              >
                <Slider.Control>
                  <Slider.Track>
                    <Slider.Range />
                  </Slider.Track>
                  <Slider.Thumb index={0} />
                </Slider.Control>
              </Slider.Root>
            </Box>
          </Grid>

          {useFont && fontsTop.length > 0 ? (
            <Box mb="4">
              <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb="2">
                顶层文字
              </Text>
              <Grid templateColumns="repeat(3, 1fr)" gap="2">
                {fontsTop.map((font, index) => (
                  <Input
                    key={`top-font-${index}`}
                    value={font}
                    maxLength={1}
                    size="sm"
                    onChange={(e) => handleTopFontChange(index, e.target.value)}
                    placeholder="Enter Value"
                  />
                ))}
              </Grid>
            </Box>
          ) : null}

          <Grid
            templateColumns={{ base: "1fr", md: "repeat(3, minmax(0, 1fr))" }}
            gap="3"
            alignItems="end"
            mt="4"
            mb="4"
          >
            <DrawControlField label="底层">
              <DrawSelect value={downDefaultVal} onChange={handleUpdateDownOpt}>
                {downCspOption.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </DrawSelect>
            </DrawControlField>

            <DrawControlField label="中轴线">
              <DrawSelect
                value={downAxisLine}
                onChange={(v) => resetLineReg(Number(v), false)}
                w={{ base: "full", sm: "108px" }}
              >
                <option value="0">{t("draws.sq1.None")}</option>
                <option value="30">{t("draws.sq1.Positive_15")}</option>
                <option value="-30">{t("draws.sq1.Negative_15")}</option>
              </DrawSelect>
            </DrawControlField>

            <Box minW="0">
              <Text fontSize="xs" fontWeight="medium" color="fg.muted" mb="1.5">
                {t("draws.sq1.Rotate")}
              </Text>
              <Slider.Root
                min={0}
                max={180}
                step={30}
                value={[downReg]}
                onValueChange={(details) =>
                  resetBaseReg(details.value[0] ?? 0, "down")
                }
              >
                <Slider.Control>
                  <Slider.Track>
                    <Slider.Range />
                  </Slider.Track>
                  <Slider.Thumb index={0} />
                </Slider.Control>
              </Slider.Root>
            </Box>
          </Grid>

          {useFont && fontsDown.length > 0 ? (
            <Box>
              <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb="2">
                底层文字
              </Text>
              <Grid templateColumns="repeat(3, 1fr)" gap="2">
                {fontsDown.map((font, index) => (
                  <Input
                    key={`down-font-${index}`}
                    value={font}
                    maxLength={1}
                    size="sm"
                    onChange={(e) =>
                      handleDownFontChange(index, e.target.value)
                    }
                    placeholder="Enter Value"
                  />
                ))}
              </Grid>
            </Box>
          ) : null}
        </>
      }
    />
  );
}

export function SQ1DrawView() {
  const { t } = useI18n();

  return (
    <DrawNavTabs
      tabsKey="sq1_draw_tabs"
      items={[
        {
          key: "simple_sq",
          label: t("draws.top_view"),
          content: <SimpleSq1Draw />,
        },
        {
          key: "double_sq",
          label: t("draws.double_view"),
          content: <DoubleSq1Draw />,
        },
      ]}
    />
  );
}
