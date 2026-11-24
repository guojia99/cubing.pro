import type { MessageKey } from "./index";
import { getIntlLocale, type Locale } from "./locales";

type PluralLocale = "en-US" | "fr" | "es";
type Forms = readonly [one: string, other: string];
type Entry = readonly [param: string, en: Forms, fr: Forms, es: Forms];

// Complete localized templates. `many` has the same wording as `other` here.
// Keep this module independent of the runtime root catalogs (which call it).
export const pluralMessages = {
  "algs.practice.mean": ["count", ["Mean of latest {count}", "Mean of latest {count}"], ["Moyenne du dernier {count}", "Moyenne des derniers {count}"], ["Media del último {count}", "Media de los últimos {count}"]],
  "algs.practice.progress": ["total", ["{count} / {total} result", "{count} / {total} results"], ["Résultat {count} / {total}", "Résultats {count} / {total}"], ["Resultado {count} / {total}", "Resultados {count} / {total}"]],
  "algs.practice.page": ["total", ["Page {page} / {pages} · {total} record", "Page {page} / {pages} · {total} records"], ["Page {page} / {pages} · {total} enregistrement", "Page {page} / {pages} · {total} enregistrements"], ["Página {page} / {pages} · {total} registro", "Página {page} / {pages} · {total} registros"]],
  "two.main.reason.limit": ["count", ["Selected depths searched. Only the top {count} solution is retained.", "Selected depths searched. Only the top {count} solutions are retained."], ["Profondeurs sélectionnées recherchées. Seule la meilleure solution {count} est conservée.", "Profondeurs sélectionnées recherchées. Seules les meilleures solutions {count} sont conservées."], ["Profundidades seleccionadas buscadas. Solo se conserva la mejor solución {count}.", "Profundidades seleccionadas buscadas. Solo se conservan las mejores soluciones {count}."]],
  "two.main.result.limit": ["count", ["Searched · Top {count} retained", "Searched · Top {count} retained"], ["Recherché · Meilleure {count} conservée", "Recherché · Meilleures {count} conservées"], ["Buscado · Se conservó la mejor {count}", "Buscado · Se conservaron las mejores {count}"]],
  "two.main.error.noSample": ["attempts", ["No matching solution found in {attempts} attempt. Relax the conditions or increase the search budget; this does not prove there is no solution.", "No matching solution found in {attempts} attempts. Relax the conditions or increase the search budget; this does not prove there is no solution."], ["Aucune solution correspondante trouvée dans {attempts} tentative. Relâchez les conditions ou augmentez le budget de recherche ; cela ne prouve pas qu'il n'y a pas de solution.", "Aucune solution correspondante trouvée dans {attempts} tentatives. Relâchez les conditions ou augmentez le budget de recherche ; cela ne prouve pas qu'il n'y a pas de solution."], ["No se encontró solución coincidente en {attempts} intento. Relaja las condiciones o aumenta el presupuesto de búsqueda; esto no prueba que no haya solución.", "No se encontró solución coincidente en {attempts} intentos. Relaja las condiciones o aumenta el presupuesto de búsqueda; esto no prueba que no haya solución."]],
  "two.main.inspectionRemaining": ["time", ["{time} second of inspection remaining", "{time} seconds of inspection remaining"], ["{time} seconde d'inspection restante", "{time} secondes d'inspection restantes"], ["Queda {time} segundo de inspección", "Quedan {time} segundos de inspección"]],
  "two.main.recordDetails": ["seconds", ["Raw time {time} · Inspection {seconds} second · Inspection penalty {penalty}", "Raw time {time} · Inspection {seconds} seconds · Inspection penalty {penalty}"], ["Temps brut {time} · Inspection {seconds} seconde · Pénalité d'inspection {penalty}", "Temps brut {time} · Inspection {seconds} secondes · Pénalité d'inspection {penalty}"], ["Tiempo bruto {time} · Inspección {seconds} segundo · Penalización de inspección {penalty}", "Tiempo bruto {time} · Inspección {seconds} segundos · Penalización de inspección {penalty}"]],
  "two.main.filterCount": ["count", ["{count} filter", "{count} filters"], ["{count} filtre", "{count} filtres"], ["Filtro {count}", "Filtros {count}"]],
  "two.main.selected": ["count", ["{count} selected", "{count} selected"], ["{count} sélectionné", "{count} sélectionnés"], ["{count} seleccionado", "{count} seleccionados"]],
  "two.main.steps": ["count", ["{count} move", "{count} moves"], ["{count} mouvement", "{count} mouvements"], ["Movimiento {count}", "Movimientos {count}"]],
  "two.main.actions": ["count", ["{count} move", "{count} moves"], ["{count} mouvement", "{count} mouvements"], ["Movimiento {count}", "Movimientos {count}"]],
  "two.main.seconds": ["count", ["{count} second", "{count} seconds"], ["{count} seconde", "{count} secondes"], ["{count} segundo", "{count} segundos"]],
  "two.main.milliseconds": ["count", ["{count} millisecond", "{count} milliseconds"], ["{count} milliseconde", "{count} millisecondes"], ["{count} milisegundo", "{count} milisegundos"]],
  "two.main.digits": ["count", ["{count} digit", "{count} digits"], ["{count} chiffre", "{count} chiffres"], ["{count} dígito", "{count} dígitos"]],
  "two.main.latest": ["count", ["Latest {count} solve", "Latest {count} solves"], ["Dernière {count} résolution", "Dernières {count} résolutions"], ["Última {count} resolución", "Últimas {count} resoluciones"]],
  "two.detail.solutionSummary": ["moves", ["{caseName} · {moves} move", "{caseName} · {moves} moves"], ["Mouvement {caseName} · {moves}", "Mouvements {caseName} · {moves}"], ["{caseName} · {moves} movimiento", "{caseName} · {moves} movimientos"]],
  "two.engine.progress.verified": ["count", ["{count} verified solution", "{count} verified solutions"], ["Solution {count} vérifiée", "Solutions {count} vérifiées"], ["{count} solución verificada", "{count} soluciones verificadas"]],
  "two.engine.ergonomics.rotations": ["count", ["{count} internal cube rotation, each charged separately with an estimated regrip; triplet context is interrupted at each rotation.", "{count} internal cube rotations, each charged separately with an estimated regrip; triplet context is interrupted at each rotation."], ["Rotation interne du cube {count}, chacune facturée séparément avec un réajustement estimé ; le contexte du triplet est interrompu à chaque rotation.", "Rotations internes du cube {count}, chacune facturée séparément avec un réajustement estimé ; le contexte du triplet est interrompu à chaque rotation."], ["Rotación interna del cubo {count}, cada una se cobra por separado con un re-agarre estimado; el contexto del triplete se interrumpe en cada rotación.", "Rotaciones internas del cubo {count}, cada una se cobra por separado con un re-agarre estimado; el contexto del triplete se interrumpe en cada rotación."]],
  "two.engine.ergonomics.regrips": ["count", ["F2 R' occurs {count} time; possible regrips are estimated heuristically and depend on finger tricks.", "F2 R' occurs {count} times; possible regrips are estimated heuristically and depend on finger tricks."], ["F2 R' se produit {count} fois ; les réajustements possibles sont estimés heuristiquement et dépendent des astuces des doigts.", "F2 R' se produit {count} fois ; les réajustements possibles sont estimés heuristiquement et dépendent des astuces des doigts."], ["F2 R' ocurre {count} vez; los posibles re-agarres se estiman heurísticamente y dependen de trucos de dedos.", "F2 R' ocurre {count} veces; los posibles re-agarres se estiman heurísticamente y dependen de trucos de dedos."]],
  "algs.classCount": ["count", ["{count} class", "{count} classes"], ["Classe {count}", "Classes {count}"], ["Clase {count}", "Clases {count}"]],
  "algs.formulaCount": ["count", ["{count} algorithm", "{count} algorithms"], ["Algorithme {count}", "Algorithmes {count}"], ["Algoritmo {count}", "Algoritmos {count}"]],
  "algs.formulaPractice.selectedCount": ["count", ["{count} formula selected", "{count} formulas selected"], ["Formule {count} sélectionnée", "Formules {count} sélectionnées"], ["Fórmula {count} seleccionada", "Fórmulas {count} seleccionadas"]],
  "algs.formulaPractice.totalRecords": ["total", ["{total} record", "{total} records"], ["Enregistrement {total}", "Enregistrements {total}"], ["Registro {total}", "Registros {total}"]],
  "algs.practiceHistoryStats.modalDesc": ["total", ["{total} record total, stats by formula", "{total} records total, stats by formula"], ["{total} enregistrement au total, statistiques par formule", "{total} enregistrements au total, statistiques par formule"], ["{total} registro en total, estadísticas por fórmula", "{total} registros en total, estadísticas por fórmula"]],
  "algs.batchCustom.pendingCount": ["count", ["{count} formula to fill this session", "{count} formulas to fill this session"], ["{count} formule pour remplir cette session", "{count} formules pour remplir cette session"], ["{count} fórmula para llenar en esta sesión", "{count} fórmulas para llenar en esta sesión"]],
  "home.thanks.count": ["count", ["{count} supporter", "{count} supporters"], ["{count} supporter", "{count} supporters"], ["Seguidor de {count}", "Seguidores de {count}"]],
  "wca.comps.resultCount": ["count", ["{count} competition", "{count} competitions"], ["Compétition {count}", "Compétitions {count}"], ["Competencia {count}", "Competencias {count}"]],
  "wca.comps.filteredByEvents": ["count", ["Filtered by {count} event", "Filtered by {count} events"], ["Filtré par {count} épreuve", "Filtré par {count} épreuves"], ["Filtrado por {count} evento", "Filtrado por {count} eventos"]],
  "wca.comps.days": ["count", ["{count} day", "{count} days"], ["Jour {count}", "Jours {count}"], ["Día {count}", "Días {count}"]],
  "wca.results.prStreakCount": ["count", ["{count} comp", "{count} comps"], ["Compétition {count}", "Compétitions {count}"], ["Competición {count}", "Competiciones {count}"]],
  "wca.milestone.count": ["count", ["{count} milestone", "{count} milestones"], ["Jalon {count}", "Jalons {count}"], ["Hito {count}", "Hitos {count}"]],
  "wca.milestone.desc.competing_anniversary": ["years", ["{years} year competing", "{years} years competing"], ["{years} année de compétition", "{years} années de compétition"], ["{years} año compitiendo", "{years} años compitiendo"]],
  "wca.milestone.desc.grand_slam": ["days", ["All official events met! {days} day from your first valid result to the last requirement.", "All official events met! {days} days from your first valid result to the last requirement."], ["Tous les événements officiels atteints ! {days} jour depuis votre premier résultat valide jusqu'à la dernière exigence.", "Tous les événements officiels atteints ! {days} jours depuis votre premier résultat valide jusqu'à la dernière exigence."], ["¡Todos los eventos oficiales cumplidos! {days} día desde tu primer resultado válido hasta el último requisito.", "¡Todos los eventos oficiales cumplidos! {days} días desde tu primer resultado válido hasta el último requisito."]],
  "wca.milestone.desc.comeback": ["years", ["Returned to competition after {years} year", "Returned to competition after {years} years"], ["Retour à la compétition après {years} année", "Retour à la compétition après {years} années"], ["Regresó a la competencia después de {years} año", "Regresó a la competencia después de {years} años"]],
  "wca.milestone.desc.first_triple_podium_competition": ["count", ["First competition with {count} podium event", "First competition with {count} podium events"], ["Première compétition avec {count} événement sur le podium", "Première compétition avec {count} événements sur le podium"], ["Primera competencia con {count} evento en el podio", "Primera competencia con {count} eventos en el podio"]],
  "wca.milestone.desc.busy_competition_year": ["count", ["{count} WCA competition in {year}", "{count} WCA competitions in {year}"], ["{count} compétition WCA en {year}", "{count} compétitions WCA en {year}"], ["{count} competencia WCA en {year}", "{count} competencias WCA en {year}"]],
  "wca.milestone.desc.multi_gold_single_comp": ["count", ["{count} gold medal in one competition", "{count} gold medals in one competition"], ["{count} médaille d'or dans une compétition", "{count} médailles d'or dans une compétition"], ["{count} medalla de oro en una competencia", "{count} medallas de oro en una competencia"]],
  "wca.milestone.busyYearTag": ["count", ["{year}: {count} comp", "{year}: {count} comps"], ["{year} : {count} compétition", "{year} : {count} compétitions"], ["{year}: {count} competencia", "{year}: {count} competencias"]],
  "wca.milestone.triplePodiumTag": ["count", ["{count} podium event", "{count} podium events"], ["{count} événement sur le podium", "{count} événements sur le podium"], ["{count} evento en el podio", "{count} eventos en el podio"]],
  "wca.milestone.multiGoldTag": ["count", ["{count} gold", "{count} golds"], ["{count} or", "{count} ors"], ["{count} oro", "{count} oros"]],
  "wca.chart.maN": ["n", ["{n}-attempt avg", "{n}-attempt avg"], ["Moyenne sur {n} tentative", "Moyenne sur {n} tentatives"], ["Promedio de {n} intento", "Promedio de {n} intentos"]],
  "teamMatch.groupMatches": ["count", ["{count} group match", "{count} group matches"], ["{count} match de groupe", "{count} matchs de groupe"], ["{count} partido de grupo", "{count} partidos de grupo"]],
  "teamMatch.recent": ["count", ["Recent {count} competition", "Recent {count} competitions"], ["{count} dernière compétition", "{count} dernières compétitions"], ["Última {count} competición", "Últimas {count} competiciones"]],
  "teamMatch.teamLimit": ["count", ["The {count}-team limit has been reached", "The {count}-team limit has been reached"], ["La limite de {count} équipe est atteinte", "La limite de {count} équipes est atteinte"], ["Se ha alcanzado el límite de {count} equipo", "Se ha alcanzado el límite de {count} equipos"]],
  "teamMatch.appended": ["count", ["Added {count} group (schools, players and teams) with random seeding results", "Added {count} groups (schools, players and teams) with random seeding results"], ["{count} groupe ajouté (établissements, participants et équipes) avec des résultats aléatoires", "{count} groupes ajoutés (établissements, participants et équipes) avec des résultats aléatoires"], ["{count} grupo añadido (centros, participantes y equipos) con resultados aleatorios", "{count} grupos añadidos (centros, participantes y equipos) con resultados aleatorios"]],
  "teamMatch.records": ["count", ["{count} record", "{count} records"], ["{count} entrée", "{count} entrées"], ["{count} registro", "{count} registros"]],
  "teamMatch.sessionSummary": ["count", ["{count} team · {status}", "{count} teams · {status}"], ["{count} équipe · {status}", "{count} équipes · {status}"], ["{count} equipo · {status}", "{count} equipos · {status}"]],
  "teamMatch.byeLimit": ["p0", ["At most {p0} team can receive direct entry", "At most {p0} teams can receive direct entry"], ["Au plus {p0} équipe peut être admise directement", "Au plus {p0} équipes peuvent être admises directement"], ["Como máximo {p0} equipo puede acceder directamente", "Como máximo {p0} equipos pueden acceder directamente"]],
  "teamMatch.noPrelimNeeded": ["p0", ["There is at most {p0} eligible full team, so no preliminary matches are needed. Continue to the main draw roster to check the order before drawing.", "There are at most {p0} eligible full teams, so no preliminary matches are needed. Continue to the main draw roster to check the order before drawing."], ["Il y a au plus {p0} équipe complète admissible : aucun match préliminaire n’est nécessaire. Vérifiez la liste et son ordre avant le tirage.", "Il y a au plus {p0} équipes complètes admissibles : aucun match préliminaire n’est nécessaire. Vérifiez la liste et son ordre avant le tirage."], ["Hay como máximo {p0} equipo completo válido; no hacen falta clasificatorias. Revisa la lista principal y su orden antes del sorteo.", "Hay como máximo {p0} equipos completos válidos; no hacen falta clasificatorias. Revisa la lista principal y su orden antes del sorteo."]],
  "teamMatch.skipElimDescription": ["p0", ["Send the top {p0} by seeding directly to main roster confirmation without preliminary matches.", "Send the top {p0} by seeding directly to main roster confirmation without preliminary matches."], ["Envoyer directement la {p0} meilleure équipe au classement vers la confirmation de la liste, sans qualifications.", "Envoyer directement les {p0} meilleures équipes au classement vers la confirmation de la liste, sans qualifications."], ["Llevar el {p0} mejor equipo por registro de siembra a confirmar la lista, sin clasificatorias.", "Llevar los {p0} mejores equipos por registro de siembra a confirmar la lista, sin clasificatorias."]],
  "teamMatch.byeOrderHint": ["p0", ["Same order as team confirmation; at most {p0} team.", "Same order as team confirmation; at most {p0} teams."], ["Même ordre que la confirmation des équipes ; au plus {p0} équipe.", "Même ordre que la confirmation des équipes ; au plus {p0} équipes."], ["Mismo orden que la confirmación de equipos; máximo {p0} equipo.", "Mismo orden que la confirmación de equipos; máximo {p0} equipos."]],
  "teamMatch.activeTeams": ["p0", ["Eligible team: {p0}", "Eligible teams: {p0}"], ["Équipe admissible : {p0}", "Équipes admissibles : {p0}"], ["Equipo válido: {p0}", "Equipos válidos: {p0}"]],
  "teamMatch.outsideTop": ["p0", ["Outside top {p0}", "Outside top {p0}"], ["Hors de la {p0} première", "Hors des {p0} premières"], ["Fuera del {p0} primero", "Fuera de los {p0} primeros"]],
  "teamMatch.uidUpdated": ["p0", ["Updated One IDs for {p0} player", "Updated One IDs for {p0} players"], ["One ID mis à jour pour {p0} participant", "One ID mis à jour pour {p0} participants"], ["One ID actualizados para {p0} participante", "One ID actualizados para {p0} participantes"]],
  "teamMatch.uidUnmatched": ["p0", ["Ignored {p0} document row with names outside the current roster", "Ignored {p0} document rows with names outside the current roster"], ["{p0} ligne ignorée : noms absents de la liste actuelle", "{p0} lignes ignorées : noms absents de la liste actuelle"], ["Se ignoró {p0} fila con nombres fuera de la lista actual", "Se ignoraron {p0} filas con nombres fuera de la lista actual"]],
  "teamMatch.uidDuplicateNames": ["p0", ["For {p0} duplicate-name row, only the first occurrence was used", "For {p0} duplicate-name rows, only the first occurrence was used"], ["Pour {p0} ligne avec nom répété, seule la première occurrence est retenue", "Pour {p0} lignes avec nom répété, seule la première occurrence est retenue"], ["En {p0} fila de nombres repetidos solo se usó la primera aparición", "En {p0} filas de nombres repetidos solo se usó la primera aparición"]],
  "teamMatch.uidUnchanged": ["p0", ["{p0} player unchanged", "{p0} players unchanged"], ["{p0} participant inchangé", "{p0} participants inchangés"], ["{p0} participante sin cambios", "{p0} participantes sin cambios"]],
  "teamMatch.uidWillUpdate": ["p0", ["Write the document’s One IDs to {p0} existing player.", "Write the document’s One IDs to {p0} existing players."], ["Les One ID du document seront attribués à {p0} participant existant.", "Les One ID du document seront attribués à {p0} participants existants."], ["Se guardarán los One ID del documento en {p0} participante existente.", "Se guardarán los One ID del documento en {p0} participantes existentes."]],
  "teamMatch.uidDuplicateHelp": ["p0", ["There is {p0} repeated-name row; the first occurrence was used.", "There are {p0} repeated-name rows; the first occurrence was used."], ["Il y a {p0} ligne à nom répété ; la première occurrence est retenue.", "Il y a {p0} lignes à nom répété ; la première occurrence est retenue."], ["Hay {p0} fila de nombres repetidos; se usó la primera aparición.", "Hay {p0} filas de nombres repetidos; se usó la primera aparición."]],
  "teamMatch.avatarsUpdated": ["p0", ["Updated {p0} player avatar", "Updated {p0} player avatars"], ["{p0} avatar mis à jour", "{p0} avatars mis à jour"], ["Se actualizó {p0} avatar", "Se actualizaron {p0} avatares"]],
  "teamMatch.activeTeamLimit": ["p0", ["At most {p0} eligible team; delete teams or mark absences at Confirm teams", "At most {p0} eligible teams; delete teams or mark absences at Confirm teams"], ["Au plus {p0} équipe admissible ; supprimez des équipes ou marquez des absences", "Au plus {p0} équipes admissibles ; supprimez des équipes ou marquez des absences"], ["Máximo {p0} equipo válido; elimina equipos o marca ausencias al confirmar", "Máximo {p0} equipos válidos; elimina equipos o marca ausencias al confirmar"]],
  "teamMatch.rosterAdded": ["p0", ["Added {p0} team and their schools and players", "Added {p0} teams and their schools and players"], ["{p0} équipe et ses établissements et participants ajoutés", "{p0} équipes et leurs établissements et participants ajoutés"], ["Se añadió {p0} equipo y sus centros y participantes", "Se añadieron {p0} equipos y sus centros y participantes"]],
  "teamMatch.rosterColumns": ["count", ["Row {line}: one team column and {count} player column required, separated by tabs or at least two spaces", "Row {line}: one team column and {count} player columns required, separated by tabs or at least two spaces"], ["Ligne {line} : une colonne d’équipe et {count} de participant, séparées par tabulations ou au moins deux espaces", "Ligne {line} : une colonne d’équipe et {count} de participants, séparées par tabulations ou au moins deux espaces"], ["Fila {line}: una columna de equipo y {count} de participante, separadas por tabuladores o al menos dos espacios", "Fila {line}: una columna de equipo y {count} de participantes, separadas por tabuladores o al menos dos espacios"]],
  "teamMatch.rosterPlayerCount": ["count", ["Row {line}: exactly {count} player required", "Row {line}: exactly {count} players required"], ["Ligne {line} : exactement {count} membre requis", "Ligne {line} : exactement {count} membres requis"], ["Fila {line}: se necesita exactamente {count} miembro", "Fila {line}: se necesitan exactamente {count} miembros"]],
  "teamMatch.rosterLimit": ["count", ["Exceeds the limit of {count} eligible team", "Exceeds the limit of {count} eligible teams"], ["Dépasse la limite de {count} équipe admissible", "Dépasse la limite de {count} équipes admissibles"], ["Supera el límite de {count} equipo válido", "Supera el límite de {count} equipos válidos"]],
  "competitionAdmin.roundsCount": ["count", ["{count} round", "{count} rounds"], ["{count} tour", "{count} tours"], ["{count} ronda", "{count} rondas"]],
  "competitionAdmin.recentAttempts": ["count", ["Last {count} attempt: {rate}%", "Last {count} attempts: {rate}%"], ["{count} dernier essai : {rate} %", "{count} derniers essais : {rate} %"], ["Último {count} intento: {rate}%", "Últimos {count} intentos: {rate}%"]],
  "competitionAdmin.mbfGroups": ["count", ["Expected {count} group of a/b time", "Expected {count} groups of a/b time"], ["{count} groupe au format a/b temps attendu", "{count} groupes au format a/b temps attendus"], ["Se requiere {count} grupo con formato a/b tiempo", "Se requieren {count} grupos con formato a/b tiempo"]],
  "competitionAdmin.mbfTiming": ["count", ["Attempting {count} cube; enter or time the result", "Attempting {count} cubes; enter or time the result"], ["{count} cube tenté : saisissez ou chronométrez le résultat", "{count} cubes tentés : saisissez ou chronométrez le résultat"], ["{count} cubo intentado: introduce o cronometra el resultado", "{count} cubos intentados: introduce o cronometra el resultado"]],
  "competitionAdmin.recordedCount": ["total", ["{filled}/{total} attempt recorded", "{filled}/{total} attempts recorded"], ["{filled}/{total} essai enregistré", "{filled}/{total} essais enregistrés"], ["{filled}/{total} intento registrado", "{filled}/{total} intentos registrados"]],
  "competitionAdmin.eventCount": ["count", ["{count} event in total", "{count} events in total"], ["{count} épreuve au total", "{count} épreuves au total"], ["{count} prueba en total", "{count} pruebas en total"]],
  "competitionAdmin.days": ["count", ["{count} day", "{count} days"], ["{count} jour", "{count} jours"], ["{count} día", "{count} días"]],
  "competitionAdmin.distribution": ["seconds", ["Result distribution ({seconds}-second bins)", "Result distribution ({seconds}-second bins)"], ["Distribution des résultats (intervalles de {seconds} seconde)", "Distribution des résultats (intervalles de {seconds} secondes)"], ["Distribución de resultados (intervalos de {seconds} segundo)", "Distribución de resultados (intervalos de {seconds} segundos)"]],
  "competitionAdmin.frequencyTooltip": ["c", ["{b}: {c} attempt", "{b}: {c} attempts"], ["{b} : {c} essai", "{b} : {c} essais"], ["{b}: {c} intento", "{b}: {c} intentos"]],
  "competitionAdmin.seconds": ["count", ["{count} second", "{count} seconds"], ["{count} seconde", "{count} secondes"], ["{count} segundo", "{count} segundos"]],
  "competitionAdmin.selectedEvents": ["total", ["{selected}/{total} event selected", "{selected}/{total} events selected"], ["{selected}/{total} épreuve sélectionnée", "{selected}/{total} épreuves sélectionnées"], ["{selected}/{total} prueba seleccionada", "{selected}/{total} pruebas seleccionadas"]],
  "puzzleExtra.filterWidth": ["width", ["Filter width {width} pixel", "Filter width {width} pixels"], ["Largeur des filtres : {width} pixel", "Largeur des filtres : {width} pixels"], ["Ancho del filtro: {width} píxel", "Ancho del filtro: {width} píxeles"]],
  "shared.error.payloadLimit": ["limit", ["Data exceeds the {limit}-byte limit", "Data exceeds the {limit}-byte limit"], ["Les données dépassent la limite de {limit} octet", "Les données dépassent la limite de {limit} octets"], ["Los datos superan el límite de {limit} byte", "Los datos superan el límite de {limit} bytes"]],
  "adminExtra.competitionTotal": ["count", ["Total competition: {count}", "Total competitions: {count}"], ["Compétition au total : {count}", "Compétitions au total : {count}"], ["Total de competición: {count}", "Total de competiciones: {count}"]],
  "adminExtra.confirmBatchReview": ["count", ["Confirm action “{action}” for {count} result", "Confirm action “{action}” for {count} results"], ["Confirmer « {action} » pour {count} résultat", "Confirmer « {action} » pour {count} résultats"], ["Confirmar «{action}» para {count} resultado", "Confirmar «{action}» para {count} resultados"]],
  "adminExtra.selectedCount": ["count", ["Selected: {count}", "Selected: {count}"], ["Sélectionné : {count}", "Sélectionnés : {count}"], ["Seleccionado: {count}", "Seleccionados: {count}"]],
  "adminExtra.requireResults": ["count", ["Enter {count} result", "Enter all {count} results"], ["Saisissez le {count} résultat", "Saisissez les {count} résultats"], ["Introduce el {count} resultado", "Introduce los {count} resultados"]],
  "adminExtra.confirmBatchEntry": ["count", ["Confirm entry of {count} result", "Confirm entry of {count} results"], ["Confirmer la saisie de {count} résultat", "Confirmer la saisie de {count} résultats"], ["Confirmar entrada de {count} resultado", "Confirmar entrada de {count} resultados"]],
  "competitionExtra.selectedCountries": ["count", ["{count} country or region selected", "{count} countries or regions selected"], ["{count} pays ou région sélectionné", "{count} pays ou régions sélectionnés"], ["{count} país o región seleccionado", "{count} países o regiones seleccionados"]],
  "competitionExtra.age": ["count", ["Age: {count} year", "Age: {count} years"], ["Âge : {count} an", "Âge : {count} ans"], ["Edad: {count} año", "Edad: {count} años"]],
  "competitionExtra.yearsOld": ["count", ["{count} year", "{count} years"], ["{count} an", "{count} ans"], ["{count} año", "{count} años"]],
  "domain.event.sliding": ["count", ["{count}-Puzzle", "{count}-Puzzle"], ["Taquin à {count} case", "Taquin à {count} cases"], ["Puzle de {count} pieza", "Puzle de {count} piezas"]],
  "wcaPuzzleExtra.moveLimit": ["count", ["The expanded algorithm must not exceed {count} move.", "The expanded algorithm must not exceed {count} moves."], ["L’algorithme développé ne doit pas dépasser {count} mouvement.", "L’algorithme développé ne doit pas dépasser {count} mouvements."], ["El algoritmo expandido no debe superar {count} movimiento.", "El algoritmo expandido no debe superar {count} movimientos."]],
  "wcaPuzzleExtra.nestingLimit": ["count", ["Algorithm nesting must not exceed {count} level.", "Algorithm nesting must not exceed {count} levels."], ["L’imbrication ne doit pas dépasser {count} niveau.", "L’imbrication ne doit pas dépasser {count} niveaux."], ["El anidamiento no debe superar {count} nivel.", "El anidamiento no debe superar {count} niveles."]],
  "wcaPuzzleExtra.notationLong": ["count", ["Notation must not exceed {count} character.", "Notation must not exceed {count} characters."], ["La notation ne doit pas dépasser {count} caractère.", "La notation ne doit pas dépasser {count} caractères."], ["La notación no debe superar {count} carácter.", "La notación no debe superar {count} caracteres."]],
  "wcaPuzzleExtra.groups": ["count", ["{count} group", "{count} groups"], ["{count} groupe", "{count} groupes"], ["{count} grupo", "{count} grupos"]],
  "adminManagement.pinLimit": ["count", ["Pin up to {count} link on the home page", "Pin up to {count} links on the home page"], ["Épinglez jusqu’à {count} lien sur l’accueil", "Épinglez jusqu’à {count} liens sur l’accueil"], ["Fija hasta {count} enlace en el inicio", "Fija hasta {count} enlaces en el inicio"]],
  "adminManagement.groupsLimit": ["count", ["Each organizing team can have up to {count} competition group", "Each organizing team can have up to {count} competition groups"], ["Chaque équipe peut avoir jusqu’à {count} groupe de compétition", "Chaque équipe peut avoir jusqu’à {count} groupes de compétition"], ["Cada equipo puede tener hasta {count} grupo de competición", "Cada equipo puede tener hasta {count} grupos de competición"]],
  "adminManagement.groupsTab": ["count", ["Competition group (up to {count})", "Competition groups (up to {count})"], ["Groupe de compétition ({count} maximum)", "Groupes de compétition ({count} maximum)"], ["Grupo de competición (máximo {count})", "Grupos de competición (máximo {count})"]],
} as const satisfies Partial<Record<MessageKey, Entry>>;

// Independent quantities in one sentence must not share a single selector.
// Exact phrase forms preserve the rest of the original template, including
// technical notation, punctuation and unrelated placeholders.
export const pluralFragments = {
  "two.main.result.metrics": [
    ["nodes", ["{nodes} node", "{nodes} nodes"], ["Nœud {nodes}", "Nœuds {nodes}"], ["Nodo {nodes}", "Nodos {nodes}"]],
    ["seconds", ["{seconds} second", "{seconds} seconds"], ["Seconde {seconds}", "Secondes {seconds}"], ["Segundo {seconds}", "Segundos {seconds}"]],
    ["overlap", ["{overlap} overlapping move", "{overlap} overlapping moves"], ["{overlap} mouvement chevauchant", "{overlap} mouvements chevauchants"], ["{overlap} movimiento superpuesto", "{overlap} movimientos superpuestos"]],
  ],
  "two.main.result.data": [
    ["loaded", ["{loaded} accepted", "{loaded} accepted"], ["{loaded} accepté", "{loaded} acceptés"], ["{loaded} aceptado", "{loaded} aceptados"]],
    ["rejected", ["{rejected} rejected", "{rejected} rejected"], ["{rejected} rejeté", "{rejected} rejetés"], ["{rejected} rechazado", "{rejected} rechazados"]],
  ],
  "two.detail.costSummary": [
    ["regrips", ["Estimated regrip {regrips}", "Estimated regrips {regrips}"], ["Estimation du repositionnement {regrips}", "Estimations des repositionnements {regrips}"], ["Reagrupamiento estimado {regrips}", "Reagrupamientos estimados {regrips}"]],
    ["rotations", ["Rotation {rotations}", "Rotations {rotations}"], ["Rotation {rotations}", "Rotations {rotations}"], ["Rotación {rotations}", "Rotaciones {rotations}"]],
  ],
  "two.detail.annotationSummary": [
    ["originalMoves", ["{originalMoves} move", "{originalMoves} moves"], ["{originalMoves} mouvement", "{originalMoves} mouvements"], ["{originalMoves} movimiento", "{originalMoves} movimientos"]],
    ["moves", ["{moves} move", "{moves} moves"], ["{moves} mouvement", "{moves} mouvements"], ["{moves} movimiento", "{moves} movimientos"]],
  ],
  "two.detail.chartSummary": [
    ["total", ["{total} saved", "{total} saved"], ["{total} sauvegardé", "{total} sauvegardés"], ["{total} guardado", "{total} guardados"]],
    ["count", ["the latest {count} attempt", "the latest {count} attempts"], ["de la dernière tentative {count}", "des dernières tentatives {count}"], ["el último intento de {count}", "los últimos intentos de {count}"]],
  ],
  "two.engine.progress.searching": [
    ["nodes", ["{nodes} node", "{nodes} nodes"], ["{nodes} nœud", "{nodes} nœuds"], ["{nodes} nodo", "{nodes} nodos"]],
    ["count", ["{count} solution", "{count} solutions"], ["{count} solution", "{count} solutions"], ["{count} solución", "{count} soluciones"]],
  ],
  "algs.batchCustom.setProgress": [
    ["pending", ["{pending} pending", "{pending} pending"], ["{pending} en attente", "{pending} en attente"], ["{pending} pendiente", "{pending} pendientes"]],
    ["total", ["{total} total", "{total} total"], ["{total} total", "{total} total"], ["{total} total", "{total} totales"]],
    ["filled", ["{filled} filled", "{filled} filled"], ["{filled} rempli", "{filled} remplis"], ["{filled} rellenada", "{filled} rellenadas"]],
  ],
  "competitionAdmin.expectedScores": [
    ["count", ["{count} result", "{count} results"], ["{count} résultat attendu", "{count} résultats attendus"], ["Se requiere {count} resultado", "Se requieren {count} resultados"]],
    ["actual", ["{actual}", "{actual}"], ["{actual} reçu", "{actual} reçus"], ["{actual}", "{actual}"]],
  ],
  "adminExtra.progress": [
    ["total", ["Processed {completed}/{total}", "Processed {completed}/{total}"], ["Traité : {completed}/{total}", "Traités : {completed}/{total}"], ["Procesado {completed}/{total}", "Procesados {completed}/{total}"]],
    ["failed", ["Failed {failed}", "Failed {failed}"], ["Échec : {failed}", "Échecs : {failed}"], ["Fallido {failed}", "Fallidos {failed}"]],
  ],
  "adminExtra.batchSummary": [
    ["total", ["Processed {total}", "Processed {total}"], ["{total} traité", "{total} traités"], ["Procesado {total}", "Procesados {total}"]],
    ["success", ["{success} succeeded", "{success} succeeded"], ["{success} réussite", "{success} réussites"], ["{success} correcto", "{success} correctos"]],
    ["failed", ["{failed} failed", "{failed} failed"], ["{failed} échec", "{failed} échecs"], ["{failed} fallido", "{failed} fallidos"]],
  ],
  "adminExtra.failedRetained": [
    ["success", ["{success} succeeded", "{success} succeeded"], ["{success} réussite", "{success} réussites"], ["{success} correcto", "{success} correctos"]],
    ["failed", ["{failed} failed; only the failed item remains in the input", "{failed} failed; only failed items remain in the input"], ["{failed} échec ; seul l’échec reste dans la saisie", "{failed} échecs ; seuls les échecs restent dans la saisie"], ["{failed} fallido; solo queda el fallido en la entrada", "{failed} fallidos; solo quedan los fallidos en la entrada"]],
  ],
  "teamMatch.appendHint": [
    ["count", ["Current team: {count}/{max}", "Current teams: {count}/{max}"], ["Équipe actuelle : {count}/{max}", "Équipes actuelles : {count}/{max}"], ["Equipo actual: {count}/{max}", "Equipos actuales: {count}/{max}"]],
  ],
  "teamMatch.poolCount": [
    ["p0", ["{p0} main draw place", "{p0} main draw places"], ["{p0} place principale", "{p0} places principales"], ["{p0} plaza principal", "{p0} plazas principales"]],
    ["p1", ["{p1} in the draw", "{p1} in the draw"], ["{p1} équipe au maximum", "{p1} équipes au maximum"], ["{p1} equipo en el sorteo", "{p1} equipos en el sorteo"]],
  ],
  "teamMatch.byeSelection": [
    ["p1", ["Direct-entry team ({p0}/{p1})", "Direct-entry teams ({p0}/{p1})"], ["Équipe admise directement ({p0}/{p1})", "Équipes admises directement ({p0}/{p1})"], ["Equipo con acceso directo ({p0}/{p1})", "Equipos con acceso directo ({p0}/{p1})"]],
  ],
  "teamMatch.minimumDrawTeams": [
    ["p0", ["At least {p0} team is required", "At least {p0} teams are required"], ["Il faut au moins {p0} équipe", "Il faut au moins {p0} équipes"], ["Se necesita al menos {p0} equipo", "Se necesitan al menos {p0} equipos"]],
    ["p1", ["top {p1} full, present team by seeding", "top {p1} full, present teams by seeding"], ["la {p1} meilleure complète et présente", "les {p1} meilleures complètes et présentes"], ["el {p1} mejor completo y presente", "los {p1} mejores completos y presentes"]],
  ],
  "teamMatch.pasteRosterHelp": [
    ["p0", ["{p0} player,", "{p0} players,"], ["{p0} membre, séparé", "{p0} membres, séparés"], ["{p0} participante separado", "{p0} participantes separados"]],
  ],
  "teamMatch.eliminationRules": [
    ["p0", ["{p0} full team,", "{p0} full teams,"], ["{p0} équipe complète,", "{p0} équipes complètes,"], ["{p0} equipo completo,", "{p0} equipos completos,"]],
    ["p1", ["the final {p1}", "the final {p1}"], ["la {p1} place principale", "les {p1} places principales"], ["la {p1} plaza principal", "las {p1} plazas principales"]],
    ["p3", ["the best {p3} by seeding enters", "the best {p3} by seeding enter"], ["le {p3} meilleur résultat de classement accède", "les {p3} meilleurs résultats de classement accèdent"], ["entra el {p3} mejor por registro", "entran los {p3} mejores por registro"]],
  ],
  "teamMatch.drawRules": [
    ["p0", ["Only the top {p0} full, present team enters.", "Only the top {p0} full, present teams enter."], ["Seule la {p0} meilleure équipe complète et présente participe.", "Seules les {p0} meilleures équipes complètes et présentes participent."], ["Participa el {p0} mejor equipo completo y presente.", "Participan los {p0} mejores equipos completos y presentes."]],
  ],
  "teamMatch.teamFormationHelp": [
    ["p1", ["{p0}–{p1} eligible team;", "{p0}–{p1} eligible teams;"], ["{p0}–{p1} équipe admissible ;", "{p0}–{p1} équipes admissibles ;"], ["{p0}–{p1} equipo válido;", "{p0}–{p1} equipos válidos;"]],
    ["p2", ["{p2} slot,", "{p2} slots,"], ["{p2} place, réservée", "{p2} places, réservées"], ["{p2} plaza y", "{p2} plazas y"]],
    ["p3", ["the top {p3} by ranking", "the top {p3} by ranking"], ["à la {p3} meilleure", "aux {p3} meilleures"], ["al {p3} mejor", "a los {p3} mejores"]],
  ],
  "teamMatch.scoreEntryHelp": [
    ["p0", ["the qualifying top {p0}", "the qualifying top {p0}"], ["la {p0} qualifiée", "les {p0} qualifiées"], ["el {p0} clasificado", "los {p0} clasificados"]],
    ["p1", ["{p1} eligible team,", "{p1} eligible teams,"], ["{p1} équipe,", "{p1} équipes,"], ["{p1} equipo válido,", "{p1} equipos válidos,"]],
    ["p2", ["only the top {p2} enters", "only the top {p2} enter"], ["seule la {p2} meilleure entre", "seules les {p2} meilleures entrent"], ["solo el {p2} mejor entra", "solo los {p2} mejores entran"]],
  ],
  "teamMatch.confirmationHelp": [
    ["p0", ["only the top {p0} full, present team enters", "only the top {p0} full, present teams enter"], ["seule la {p0} meilleure équipe complète et présente participe", "seules les {p0} meilleures équipes complètes et présentes participent"], ["entra el {p0} mejor equipo completo y presente", "entran los {p0} mejores equipos completos y presentes"]],
    ["p1", ["the qualifying top {p1}", "the qualifying top {p1}"], ["la {p1} qualifiée", "les {p1} qualifiées"], ["el {p1} clasificado", "los {p1} clasificados"]],
  ],
  "teamMatch.mainPoolSkippedHelp": [
    ["count", ["The top {count} in the overall ranking enters", "The top {count} in the overall ranking enter"], ["la {count} première du classement général accède", "les {count} premières du classement général accèdent"], ["el {count} primero de la clasificación general pasa", "los {count} primeros de la clasificación general pasan"]],
  ],
  "teamMatch.mainPoolHelp": [
    ["count", ["main draw top {count} status", "main draw top {count} status"], ["à la {count} place principale", "aux {count} places principales"], ["a la {count} plaza principal", "a las {count} plazas principales"]],
  ],
} as const satisfies Partial<Record<MessageKey, readonly Entry[]>>;

const rules = new Map<PluralLocale, Intl.PluralRules>();
const entries: Partial<Record<MessageKey, Entry>> = pluralMessages;
const fragments: Partial<Record<MessageKey, readonly Entry[]>> = pluralFragments;

/** Select grammar only; interpolation and display number formatting belong to the caller. */
export function applyPlural(
  locale: Locale,
  key: MessageKey,
  template: string,
  params: Readonly<Record<string, string | number>>,
): string {
  if (locale !== "en-US" && locale !== "fr" && locale !== "es") return template;
  const entry = Object.hasOwn(entries, key) ? entries[key] : undefined;
  const parts = Object.hasOwn(fragments, key) ? fragments[key] : undefined;
  if (!entry && !parts) return template;
  let rule = rules.get(locale);
  if (!rule) {
    rule = new Intl.PluralRules(getIntlLocale(locale));
    rules.set(locale, rule);
  }
  const index = locale === "en-US" ? 1 : locale === "fr" ? 2 : 3;
  const select = (item: Entry): string | undefined => {
    const value = Object.hasOwn(params, item[0]) ? params[item[0]] : undefined;
    // IDs, preformatted numbers and formula literals must never be coerced.
    if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
    return item[index][rule.select(value) === "one" ? 0 : 1];
  };
  if (entry) return select(entry) ?? template;
  for (const part of parts ?? []) {
    const selected = select(part);
    if (selected === undefined) continue;
    // Longest form first prevents a singular noun matching a plural prefix.
    const candidates = [...new Set(part[index])].sort((a, b) => b.length - a.length);
    const source = candidates.find(candidate => template.includes(candidate));
    if (source !== undefined) template = template.replace(source, () => selected);
  }
  return template;
}
