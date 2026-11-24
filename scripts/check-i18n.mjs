import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const visibleProperties = /^(?:label|placeholder|title|alt|description|caption|content|message|text|header|tooltip|okText|cancelText|emptyText|aria-(?:label|description|valuetext|roledescription))$/;

// Exact path + context + decoded literal. Every exception must explain its display use.
// Missing/stale entries fail, so moving or changing text requires another review.
export const ALLOWLIST = [
  // The fields below are source identities/protocol labels, not translated prose.
  ["src/components/Data/cube_comps/comps_tables.tsx", "property:label", "WCA", "Official World Cube Association acronym."],
  ["src/components/Data/cube_comps/comps_tables.tsx", "attribute:alt", "WCA", "Organization logo identity."],
  ["src/components/puzzles/PuzzlePreferencesPanel.tsx", "jsx", "2D", "Dimensionality notation for the renderer."],
  ["src/components/puzzles/PuzzlePreferencesPanel.tsx", "jsx", "3D", "Dimensionality notation for the renderer."],
  ["src/lib/staticExportPaths.ts", "property:placeholder", "/competition/", "Static export destination path prefix, never a form hint."],
  ["src/lib/staticExportPaths.ts", "property:placeholder", "/player/", "Static export player fallback path prefix."],
  ["src/lib/staticExportPaths.ts", "property:placeholder", "/wca/player/", "Static export WCA fallback path prefix."],
  ["src/lib/staticExportPaths.ts", "property:placeholder", "/admin/organizers/", "Static export organizer fallback path prefix."],
  ["src/lib/staticExportPaths.ts", "property:placeholder", "/comp/", "Static export competition path segment."],
  ["src/lib/staticExportPaths.ts", "property:placeholder", "/result/index.html", "Static export results fallback filename."],
  ["src/lib/staticExportPaths.ts", "property:placeholder", "/index.html", "Static export fallback filename, used in three path templates.", 3],
  ["src/views/admin/AdminAcknowledgmentsPageView.tsx", "attribute:placeholder", "https://...", "Literal URL syntax example for a link field."],
  ["src/views/admin/AdminCompetitionGroupsPageView.tsx", "property:title", "ID", "Database record identifier column."],
  ["src/views/admin/AdminCompetitionGroupsPageView.tsx", "property:title", "QQ UID", "QQ platform identifier column."],
  ["src/views/admin/AdminOrganizersPageView.tsx", "property:title", "CubeID", "Public CubeID field name in both organizer tables.", 2],
  ["src/views/admin/AdminOrganizersPageView.tsx", "property:title", "ID", "Organizer record identifier column."],
  ["src/views/admin/AdminOrganizersPageView.tsx", "attribute:label", "ID", "Organizer record identifier field."],
  ["src/views/admin/AdminUsersPageView.tsx", "property:label", "competitionAdmin.player", "AUTH_MANAGE_BITS key translated with t(b.label) at rendering."],
  ["src/views/admin/AdminUsersPageView.tsx", "property:label", "competitionAdmin.organizer", "Organizer permission message key translated when rendering."],
  ["src/views/admin/AdminUsersPageView.tsx", "property:label", "competitionAdmin.delegate", "Delegate permission message key translated when rendering."],
  ["src/views/admin/AdminUsersPageView.tsx", "property:label", "competitionAdmin.admin", "Administrator permission key translated when rendering."],
  ["src/views/admin/AdminUsersPageView.tsx", "property:label", "competitionAdmin.superAdmin", "Super administrator permission key translated when rendering."],
  ["src/views/admin/AdminUsersPageView.tsx", "property:title", "ID", "Internal user record identifier column."],
  ["src/views/admin/AdminUsersPageView.tsx", "property:title", "CubeID", "Public CubeID identifier column."],
  ["src/views/admin/AdminUsersPageView.tsx", "property:title", "WcaID", "WCA identifier schema field name."],
  ["src/views/admin/AdminUsersPageView.tsx", "property:title", "QQ", "QQ platform name in user table."],
  ["src/views/admin/AdminUsersPageView.tsx", "property:title", "QQUniID", "QQ cross-application identifier schema name."],
  ["src/views/admin/AdminUsersPageView.tsx", "attribute:label", "QQ", "QQ platform account fields.", 2],
  ["src/views/admin/AdminUsersPageView.tsx", "attribute:label", "WCA ID", "Official WCA competitor identifier field."],
  ["src/views/admin/AdminUsersPageView.tsx", "attribute:label", "QQUniID", "QQ cross-application identifier field."],
  ["src/views/admin/AdminUsersPageView.tsx", "attribute:label", "WCAID", "WCA identifier schema field."],
  ["src/views/admin/LoginPage.tsx", "attribute:alt", "WCA", "WCA authentication provider logo."],
  ["src/views/admin/OrganizersCompsPageView.tsx", "jsx", "ID", "Competition identifier fields for lookup and import.", 2],
  ["src/views/Advertisement/ads/contactAd.tsx", "jsx", "guojia09900@gmail.com", "Published contact email address must remain exact."],
  ["src/views/Algs/components/AlgsPageSettingsPanel.tsx", "jsx", "px)", "Pixel unit suffix on two size controls.", 2],
  ["src/views/Algs/components/FormulaPracticeModal.tsx", "jsx", "ao", "Average-of statistic prefix followed by sample count."],
  ["src/views/Algs/utils/twoByTwoCategories.ts", "property:label", "LS / EGLS", "Established Last Slot method names."],
  ["src/views/Algs/utils/twoByTwoCategories.ts", "property:label", "CLL / EG", "Established two-by-two method names."],
  ["src/views/Algs/utils/twoByTwoCategories.ts", "property:label", "CBL", "Established CBL method acronym."],
  ["src/views/BuyCoffee/BuyCoffeePageView.tsx", "jsx", "guojia09900@gmail.com", "Published support contact email address."],
  ["src/views/Competition/CompetitionComponents/CompetitionDetail.tsx", "attribute:alt", "WCA", "Competition affiliation logo identity."],
  ["src/views/Competition/CompetitionComponents/CompetitionDetail.tsx", "attribute:label", "QQ", "QQ contact platform name."],
  ["src/views/Competition/CompetitionComponents/groupTimer/GroupTimer.tsx", "jsx", "DNF", "Standard competition did-not-finish score code."],
  ["src/views/Competition/CompetitionComponents/groupTimer/GroupTimer.tsx", "jsx", "DNS", "Standard competition did-not-start score code."],
  ["src/views/FloppyReduction/components/FrTutorialPanel.tsx", "attribute:title", "2FB → R2 U2", "Case identifier followed by literal cube moves."],
  ["src/views/FloppyReduction/components/FrTutorialPanel.tsx", "attribute:title", "4-0 → U2", "Case identifier followed by literal U2 move."],
  ["src/views/FloppyReduction/components/FrTutorialPanel.tsx", "jsx", "2014MIAO02", "Credited contributor's exact WCA identifier."],
  ["src/views/FloppyReduction/utils/caseData.ts", "property:label", "2RL", "FR two-right-left case code."],
  ["src/views/FloppyReduction/utils/caseData.ts", "property:label", "2FB", "FR two-front-back case code."],
  ["src/views/FloppyReduction/utils/caseData.ts", "property:label", "2-2o", "FR opposite 2-2 case code."],
  ["src/views/FloppyReduction/utils/caseData.ts", "property:label", "2-2a", "FR adjacent 2-2 case code."],
  ["src/views/FloppyReduction/utils/caseData.ts", "property:label", "3-1 / 2FB", "FR 3-1 case and 2FB continuation."],
  ["src/views/FloppyReduction/utils/caseData.ts", "property:label", "2-2a / 2FB", "FR adjacent case and 2FB continuation."],
  ["src/views/FloppyReduction/utils/caseData.ts", "property:label", "2-2a / 2RL", "FR adjacent case and 2RL continuation."],
  ["src/views/FloppyReduction/utils/caseData.ts", "property:label", "2-2o / 1", "FR opposite case and single-piece continuation."],
  ["src/views/FloppyReduction/utils/caseData.ts", "property:label", "4-0 / 2FB", "FR 4-0 case and 2FB continuation."],
  ["src/views/FloppyReduction/utils/caseData.ts", "property:label", "4-0 / 2RL", "FR 4-0 case and 2RL continuation."],
  ["src/views/FloppyReduction/utils/caseData.ts", "property:label", "2-2o / 2FB", "FR opposite case and 2FB continuation."],
  ["src/views/FloppyReduction/utils/caseData.ts", "property:label", "2-2o / 2RL", "FR opposite case and 2RL continuation."],
  ["src/views/FloppyReduction/utils/caseData.ts", "property:label", "3-1 / 2RL", "FR 3-1 case and 2RL continuation."],
  ["src/views/FloppyReduction/utils/caseData.ts", "property:label", "2-2a / 1", "FR adjacent case and single-piece continuation."],
  ["src/views/GroupCompetitions/Player/components/BestBoGroup.tsx", "jsx", "Bo", "Best-of statistic prefix followed by attempt count."],
  ["src/views/GroupCompetitions/Player/components/PlayerDetail.tsx", "property:title", "CubeID", "Competitor's public CubeID identifier."],
  ["src/views/GroupCompetitions/Player/components/PlayerDetail.tsx", "property:title", "WcaID", "Competitor's WCA identifier schema label."],
  ["src/views/GroupCompetitions/Player/components/PlayerDetail.tsx", "property:title", "CR", "Community record code in single and average columns.", 2],
  ["src/views/GroupCompetitions/Players/GcPlayersView.tsx", "property:title", "CubeID", "Public competitor identifier column."],
  ["src/views/GroupCompetitions/Players/GcPlayersView.tsx", "property:title", "WcaID", "WCA competitor identifier column."],
  ["src/views/GroupCompetitions/Records/RecordWithBest.tsx", "property:label", "CubingPro", "Record source organization name."],
  ["src/views/GroupCompetitions/Records/RecordWithEvents.tsx", "property:label", "CubingPro", "Event record source organization name."],
  ["src/views/TeamMatch/components/BracketStage.tsx", "jsx", "VS", "Conventional bracket matchup separator."],
  ["src/views/TeamMatch/components/LiveSettingsModal.tsx", "attribute:placeholder", "linear-gradient(...)", "CSS function syntax example, not explanatory prose."],
  ["src/views/TeamMatch/components/OneCompPrelimImportCard.tsx", "property:title", "One ID", "One competition platform identifier."],
  ["src/views/TeamMatch/components/OneCompPrelimImportCard.tsx", "property:title", "u_id", "Exact imported source schema column."],
  ["src/views/TeamMatch/components/PkArenaFullscreen.tsx", "jsx", "PK", "Arena match mode acronym."],
  ["src/views/TeamMatch/components/PkArenaHeroSlideOver.tsx", "jsx", "WCA ID：", "WCA identifier label with punctuation."],
  ["src/views/TeamMatch/components/PkGroupModal.tsx", "jsx", "DNF", "Group result penalty code."],
  ["src/views/TeamMatch/components/PkModal.tsx", "jsx", "DNF", "Individual result penalty code."],
  ["src/views/TeamMatch/components/PreliminaryBatchModal.tsx", "jsx", "DNF", "Penalty code in batch controls and attempt rows.", 3],
  ["src/views/TeamMatch/components/SeedingPlayerModal.tsx", "jsx", "DNF", "Penalty code in four seeding score controls.", 4],
  ["src/views/TeamMatch/components/SeedingPlayerModal.tsx", "jsx", "WCA", "WCA import provider name."],
  ["src/views/TeamMatch/components/SeedingPlayerModal.tsx", "jsx", "One", "One import provider name."],
  ["src/views/TeamMatch/TeamMatchSteps.tsx", "property:title", "WCA", "WCA score import source."],
  ["src/views/TeamMatch/TeamMatchSteps.tsx", "property:title", "One", "One score import source."],
  ["src/views/TeamMatch/TeamMatchSteps.tsx", "jsx", "VS", "Team matchup separator."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "CLL", "Established CLL method name."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "EG1", "Established EG1 method name."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "EG2", "Established EG2 method name."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "LEG1", "Established LEG1 method name."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "LS", "Last Slot method prefix followed by its numeric variant in the source template."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "CBL", "Established CBL method name."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "EGLS1", "Established EGLS1 method name."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "EGLS2", "Established EGLS2 method name."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "TEG1", "Established TEG1 method name."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "TEG2", "Established TEG2 method name."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "FH", "Established FH method name."],
  ["src/views/TwoSolver/engine/types.ts", "property:description", "同色面，下层排列完整", "Legacy CLL metadata; UI tooltip uses two.main.methodDescription.CLL."],
  ["src/views/TwoSolver/engine/types.ts", "property:description", "同色面，背面 bar", "Legacy EG1 metadata; UI tooltip uses two.main.methodDescription.EG1."],
  ["src/views/TwoSolver/engine/types.ts", "property:description", "同色面，下层无 bar", "Legacy EG2 metadata; UI tooltip uses two.main.methodDescription.EG2."],
  ["src/views/TwoSolver/engine/types.ts", "property:description", "同色面，左侧 bar", "Legacy LEG1 metadata; UI tooltip uses two.main.methodDescription.LEG1."],
  ["src/views/TwoSolver/engine/types.ts", "property:description", "下层排列完整，一个角扭转", "Legacy TCLL metadata; UI uses two.main.methodDescription keyed by method.id."],
  ["src/views/TwoSolver/engine/types.ts", "property:description", "三张贴纸朝下，第四个目标角在上层", "Legacy LS metadata; UI uses two.main.methodDescription keyed by method.id."],
  ["src/views/TwoSolver/engine/types.ts", "property:description", "四个目标色角块在下层，朝向不限", "Legacy CBL metadata; UI tooltip uses two.main.methodDescription.CBL."],
  ["src/views/TwoSolver/engine/types.ts", "property:description", "Last Slot，补角后为 EG1 型排列", "Legacy EGLS1 metadata; UI tooltip uses two.main.methodDescription.EGLS1."],
  ["src/views/TwoSolver/engine/types.ts", "property:description", "Last Slot，补角后为 EG2 型排列", "Legacy EGLS2 metadata; UI tooltip uses two.main.methodDescription.EGLS2."],
  ["src/views/TwoSolver/engine/types.ts", "property:description", "单角扭转，EG1 型下层排列", "Legacy TEG1 metadata; UI tooltip uses two.main.methodDescription.TEG1."],
  ["src/views/TwoSolver/engine/types.ts", "property:description", "单角扭转，EG2 型下层排列", "Legacy TEG2 metadata; UI tooltip uses two.main.methodDescription.TEG2."],
  ["src/views/TwoSolver/engine/types.ts", "property:description", "相邻两张同色朝下并组成侧面 bar", "Legacy FH metadata; UI tooltip uses two.main.methodDescription.FH."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "白", "Source U-face identity; UI uses two.main.color.U."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "红", "Source R-face identity; UI uses two.main.color.R."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "绿", "Source F-face identity; UI uses two.main.color.F."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "黄", "Source D-face identity; UI uses two.main.color.D."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "橙", "Source L-face identity; UI uses two.main.color.L."],
  ["src/views/TwoSolver/engine/types.ts", "property:label", "蓝", "Source B-face identity; UI uses two.main.color.B."],
  ["src/views/TwoSolver/PracticeStats.tsx", "jsx", "ao5", "Standard average-of-five metric code."],
  ["src/views/TwoSolver/PracticeStats.tsx", "jsx", "ao12", "Standard average-of-twelve metric code."],
  ["src/views/TwoSolver/SolutionCards.tsx", "jsx", "AUF", "Adjustment of upper face notation."],
  ["src/views/TwoSolver/SolutionCards.tsx", "jsx", "3D", "Three-dimensional puzzle preview mode."],
  ["src/views/TwoSolver/TwoSolverView.tsx", "property:label", "two.main.search", "Panel label key passed to t(panel.label)."],
  ["src/views/TwoSolver/TwoSolverView.tsx", "property:label", "two.main.filters", "Filter panel key passed to t(panel.label)."],
  ["src/views/TwoSolver/TwoSolverView.tsx", "property:label", "two.main.practice", "Practice panel key passed to t(panel.label)."],
  ["src/views/TwoSolver/TwoSolverView.tsx", "property:label", "two.main.timer", "Timer panel key passed to t(panel.label)."],
  ["src/views/TwoSolver/TwoSolverView.tsx", "property:label", "two.main.display", "Display panel key passed to t(panel.label)."],
  ["src/views/TwoSolver/TwoSolverView.tsx", "jsx", "s", "Seconds unit after a localized elapsed time."],
  ["src/views/TwoSolver/TwoSolverView.tsx", "attribute:placeholder", "R U R' F2…", "Example scramble consisting only of cube notation."],
  ["src/views/TwoSolver/TwoSolverView.tsx", "jsx", "DNF", "Timer did-not-finish penalty code."],
  ["src/views/Wca/PlayerComponents/MilestoneContent.tsx", "property:label", "首次比赛", "Source first_competition label; Milestone.tsx replaces it with wca.milestone.type.*."],
  ["src/views/Wca/PlayerComponents/MilestoneContent.tsx", "property:label", "首次出国赛", "Source first_overseas_competition label; consumer translates by value."],
  ["src/views/Wca/PlayerComponents/MilestoneContent.tsx", "property:label", "参赛周年", "Source competing_anniversary label; consumer translates by value."],
  ["src/views/Wca/PlayerComponents/MilestoneContent.tsx", "property:label", "巨大进步", "Source significant_improvement label; consumer translates by value."],
  ["src/views/Wca/PlayerComponents/MilestoneContent.tsx", "property:label", "全项目达成", "Source grand_slam label; consumer translates by value."],
  ["src/views/Wca/PlayerComponents/MilestoneContent.tsx", "property:label", "回归", "Source comeback label; consumer translates by value."],
  ["src/views/Wca/PlayerComponents/MilestoneContent.tsx", "property:label", "盲拧首成", "Source first_blindfolded_success label; consumer translates by value."],
  ["src/views/Wca/PlayerComponents/MilestoneContent.tsx", "property:label", "领奖台", "Source first_podium label; consumer translates by value."],
  ["src/views/Wca/PlayerComponents/MilestoneContent.tsx", "property:label", "破纪录", "Source record_breaker label; consumer translates by value."],
  ["src/views/Wca/PlayerComponents/MilestoneContent.tsx", "property:label", "百次参赛", "Source nth_competition label; consumer translates by value."],
  ["src/views/Wca/PlayerComponents/MilestoneContent.tsx", "property:label", "三阶 sub-10 平均", "Source first_333_average_sub10 label; consumer translates by value."],
  ["src/views/Wca/PlayerComponents/MilestoneContent.tsx", "property:label", "单届多领奖台", "Source first_triple_podium_competition label; consumer translates by value."],
  ["src/views/Wca/PlayerComponents/MilestoneContent.tsx", "property:label", "单年高频参赛", "Source busy_competition_year label; consumer translates by value."],
  ["src/views/Wca/PlayerComponents/MilestoneContent.tsx", "property:label", "单届多金", "Source multi_gold_single_comp label; consumer translates by value."],
  ["src/views/Wca/ProportionEstimation.tsx", "property:label", "WR", "World record reference code."],
  ["src/views/Wca/ProportionEstimation.tsx", "jsx", "s", "Seconds unit on estimated time."],
  ["src/views/Wca/Statistics/GrandSlamRank.tsx", "property:title", "WR", "World record column code."],
  ["src/views/Wca/Statistics/GrandSlamRank.tsx", "jsx", "WR", "World record reference badge."],
  ["src/views/Welcome/WelcomeInfoCards.tsx", "attribute:alt", "WCA", "WCA results source logo."],
  ["src/views/Welcome/WelcomeInfoCards.tsx", "property:title", "CLL", "Official CLL algorithm set name."],
  ["src/views/Welcome/WelcomeInfoCards.tsx", "property:title", "EG-1", "Established EG-1 algorithm set name."],
  ["src/views/Welcome/WelcomeInfoCards.tsx", "property:title", "OLL", "Established OLL algorithm set name."],
  ["src/views/Welcome/WelcomeInfoCards.tsx", "property:title", "PLL", "Established PLL algorithm set name."],
  ["src/views/Welcome/WelcomeInfoCards.tsx", "jsx", "Pyraminx", "Puzzle proper name on algorithm link."],
  ["src/views/Welcome/WelcomeInfoCards.tsx", "jsx", "FTO", "Face-Turning Octahedron puzzle acronym."],
  ["src/views/Welcome/WelcomeInfoCards.tsx", "property:title", "SQ-1", "Square-1 puzzle identifier."],
  ["src/views/Welcome/WelcomeInfoCards.tsx", "property:title", "Megaminx", "Puzzle proper name on algorithm link."],
  ["src/views/Welcome/WelcomeInfoCards.tsx", "property:title", "Skewb", "Puzzle proper name on algorithm link."],
].map(([file, context, text, reason, count = 1]) => ({ file, context, text, reason, count }));

function propertyName(node, source) {
  return ts.isIdentifier(node) || ts.isStringLiteralLike(node) ? node.text : node.getText(source);
}

function humanText(text) {
  text = text.replace(/&#(x[\da-f]+|\d+);/gi, (entity, code) => {
    const value = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code);
    return value <= 0x10ffff ? String.fromCodePoint(value) : entity;
  }).replace(/&(?:amp|lt|gt|quot|apos|nbsp|larr|rarr|uarr|darr|times|hellip|copy|reg);/g, " ");
  if (!/\p{L}/u.test(text)) return false;
  // Complete cube move sequences and numeric units are language-independent notation.
  if (/^[URFDLBMESxyzurfdlb](?:w)?(?:2|3)?['’]?(?:\s+[URFDLBMESxyzurfdlb](?:w)?(?:2|3)?['’]?)*$/.test(text.trim())) return false;
  if (/^\d+(?:\.\d+)?\s*(?:ms|s|px|em|rem|vh|vw|Hz|MB|KB|GB)$/i.test(text.trim())) return false;
  return true;
}

export function scanSource(file, text) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true,
    /\.[jt]sx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  if (source.parseDiagnostics.length) {
    const diagnostic = source.parseDiagnostics[0];
    const position = source.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
    throw new Error(`${file}:${position.line + 1}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`);
  }
  const findings = [];
  const seen = new Set();
  function record(node, context, value) {
    if (!humanText(value)) return;
    const identity = `${node.pos}:${context}`;
    if (seen.has(identity)) return;
    seen.add(identity);
    const position = source.getLineAndCharacterOfPosition(node.getStart(source));
    findings.push({ file, line: position.line + 1, column: position.character + 1, context, text: value });
  }
  // Follow only expressions whose literal pieces can reach the displayed value.
  // Arguments to arbitrary functions are not assumed to be display strings.
  function displayed(node, context) {
    if (!node) return;
    if (ts.isStringLiteralLike(node)) record(node, context, node.text);
    else if (ts.isTemplateExpression(node)) {
      record(node.head, context, node.head.text);
      for (const span of node.templateSpans) {
        displayed(span.expression, context);
        record(span.literal, context, span.literal.text);
      }
    } else if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node)
      || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)) displayed(node.expression, context);
    else if (ts.isConditionalExpression(node)) {
      displayed(node.whenTrue, context);
      displayed(node.whenFalse, context);
    } else if (ts.isBinaryExpression(node) && [ts.SyntaxKind.PlusToken,
      ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.AmpersandAmpersandToken]
      .includes(node.operatorToken.kind)) {
      if (node.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken) displayed(node.left, context);
      displayed(node.right, context);
    } else if (ts.isArrayLiteralExpression(node)) {
      for (const element of node.elements) displayed(element, context);
    }
    // Render callbacks are visited below. Function arguments (translation keys,
    // formatter options, paths) need data-flow knowledge and are not display text.
  }
  function visit(node) {
    if (ts.isJsxText(node)) record(node, "jsx", node.text.replace(/\s+/g, " ").trim());
    if (ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent)) displayed(node.expression, "jsx");
    if (ts.isJsxAttribute(node) && visibleProperties.test(node.name.getText(source))) {
      const value = node.initializer;
      displayed(value && ts.isJsxExpression(value) ? value.expression : value, `attribute:${node.name.getText(source)}`);
    }
    if (ts.isPropertyAssignment(node) && visibleProperties.test(propertyName(node.name, source))) {
      displayed(node.initializer, `property:${propertyName(node.name, source)}`);
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(source);
      if (/^(?:(?:\w+\.)*(?:(?:toast|toaster)(?:\.(?:success|error|warning|warn|info|loading|open|create|promise))?|(?:message|notification)\.(?:success|error|warning|warn|info|loading|open))|alert|confirm|prompt)$/.test(callee)) {
        displayed(node.arguments[0], "toast");
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return findings;
}

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      // Root catalogs have their own integrity test; third-party sources are excluded.
      return path === resolve(root, "src/i18n") || /^(?:vendor|vendors|__tests__|__fixtures__|node_modules)$/.test(entry.name)
        ? [] : sourceFiles(path);
    }
    return /\.[cm]?[jt]sx?$/.test(entry.name) && !/\.(?:test|spec|d)\.[cm]?[jt]sx?$/.test(entry.name)
      ? [path] : [];
  });
}

export function audit(findings, allowlist) {
  const errors = [];
  const used = new Map();
  const entries = new Map();
  const keyOf = item => JSON.stringify([item.file, item.context, item.text]);
  for (const entry of allowlist) {
    const key = keyOf(entry);
    if (!entry.reason?.trim() || !entry.file || !entry.context || !entry.text
      || !Number.isInteger(entry.count ?? 1) || (entry.count ?? 1) < 1 || entries.has(key)) {
      errors.push(`Invalid/duplicate allowlist entry: ${key}`);
    }
    entries.set(key, entry);
  }
  const remaining = findings.filter(finding => {
    const key = keyOf(finding);
    if (!entries.has(key)) return true;
    const count = (used.get(key) ?? 0) + 1;
    used.set(key, count);
    if (count > (entries.get(key).count ?? 1)) return true;
    return false;
  });
  for (const [key, entry] of entries) {
    if ((used.get(key) ?? 0) < (entry.count ?? 1)) errors.push(`Stale allowlist entry/count: ${key}`);
  }
  return { remaining, errors, allowed: findings.length - remaining.length };
}

function selfTest() {
  const text = `
    // <span>注释不应报告</span>
    const key = "技术键";
    const ui = <><span>待翻译</span><Input label="姓名" placeholder={'Enter name'}
      title={ok ? 'Ready' : '等待'} aria-label={\`打开\${id}\`} />
      <span>{ok && '保存'}</span><span>{t('common.save')}</span>
      <span>R U R' U'</span><span>× 222 / +2</span><span>{'WCA'}</span></>;
    const options = [{ label: '选项', value: '技术值' }];
    toast.success('完成'); toaster.create({ title: '错误' }); message.error(\`失败\${id}\`);
    console.log('诊断'); const competitionId = '线上赛';
    message('two.main.search'); // Local message descriptor, not an Ant toast.
    const encoded = <span>&#20013;&#x6587;</span>;
    const words = <><button>buy</button><button>full</button><span>&unknown;</span></>;
  `;
  const found = scanSource("src/example.tsx", text);
  assert.deepEqual(found.map(item => item.text), ["待翻译", "姓名", "Enter name", "Ready", "等待", "打开", "保存", "WCA", "选项", "完成", "错误", "失败", "&#20013;&#x6587;", "buy", "full", "&unknown;"]);
  assert.ok(found.every(item => item.line > 0 && item.column > 0));
  const exception = { file: "src/example.tsx", context: "jsx", text: "WCA", reason: "Official organization acronym." };
  assert.equal(audit(found, [exception]).allowed, 1);
  assert.equal(audit(found, [exception]).remaining.length, found.length - 1);
  assert.equal(audit([], [exception]).errors.length, 1);
  assert.equal(audit(found, [{ ...exception, reason: "" }]).errors.length, 1);
  assert.equal(audit(found, [{ ...exception, count: 0 }]).errors.length, 1);
  assert.equal(audit(found, [{ ...exception, count: 2 }]).errors.length, 1);
  assert.equal(audit(found, [exception, exception]).errors.length, 1);
  assert.equal(audit([found[7], found[7]], [exception]).remaining.length, 1, "Repeated exceptions cannot grow");
  assert.equal(audit([{ ...found[0], text: "新增中文" }], [exception]).remaining.length, 1);
  assert.equal(audit([{ ...found[7], file: "src/other.tsx" }], [exception]).remaining.length, 1);
  assert.equal(audit([{ ...found[7], context: "attribute:title" }], [exception]).remaining.length, 1);
  assert.throws(() => scanSource("src/broken.tsx", "const broken = <span>"), /src\/broken.tsx/);
  console.log("PASS check-i18n AST and exact allowlist self-tests");
}

function main() {
  if (process.argv.slice(2).some(arg => arg !== "--self-test")) {
    throw new Error("Usage: node scripts/check-i18n.mjs [--self-test]");
  }
  if (process.argv.includes("--self-test")) return selfTest();
  const findings = sourceFiles(resolve(root, "src")).flatMap(path =>
    scanSource(relative(root, path).replaceAll("\\", "/"), readFileSync(path, "utf8")));
  const result = audit(findings, ALLOWLIST);
  for (const item of result.remaining) {
    console.error(`${item.file}:${item.line}:${item.column} [${item.context}] ${JSON.stringify(item.text)}`);
  }
  for (const error of result.errors) console.error(error);
  console.log(`check-i18n: ${result.remaining.length} unreviewed UI literals; ${result.allowed} reviewed exceptions; ${result.errors.length} allowlist errors.`);
  if (result.remaining.length || result.errors.length) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main();
