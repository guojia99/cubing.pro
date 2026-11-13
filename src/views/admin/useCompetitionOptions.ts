"use client";

import { useEffect, useState } from "react";
import { competitionError, getCompetitionFilters, type CompetitionFilters } from "@/services/cubing-pro/auth/groupCompetition";
import { apiGetGroups, apiMeOrganizers } from "@/services/cubing-pro/auth/organizers";

export function useCompetitionOptions(admin: boolean) {
  const [options, setOptions] = useState<CompetitionFilters>({ organizers: [], groups: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    (async () => {
      if (admin) return getCompetitionFilters(controller.signal);
      const me = await apiMeOrganizers();
      const organizers = (me.data.items ?? []).map(({ id, Name }) => ({ id, Name }));
      const groups = await Promise.all(organizers.map(async (org) => {
        const response = await apiGetGroups(org.id);
        return (response.data.items ?? []).map((group) => ({ id: group.id, Name: group.name, OrganizersID: org.id }));
      }));
      return { organizers, groups: groups.flat() };
    })().then((value) => { if (!controller.signal.aborted) setOptions(value); })
      .catch((e) => { if (!controller.signal.aborted) setError(competitionError(e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [admin]);
  return { options, loading, error };
}
