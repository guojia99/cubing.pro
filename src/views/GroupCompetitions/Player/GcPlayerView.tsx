"use client";

import "antd/dist/reset.css";
import "../competition-ui.css";
import { Surface } from "@/components/ui/page";
import { Spin } from "antd";
import { useI18n } from "@/contexts/I18nProvider";

import { useRouteParam } from "@/hooks/useRouteParam";
import { useEffect, useState } from "react";

import { NotFoundStatus } from "@/components/Status/NotFoundStatus";
import { apiPlayer } from "@/services/cubing-pro/players/players";
import type { PlayersAPI } from "@/services/cubing-pro/players/typings";
import { isRequestCanceled } from "@/services/cubing-pro/request";

import PlayerDetail from "./components/PlayerDetail";
import PlayerResults from "./components/PlayerResults";
import styles from "./gc-player.module.css";

export function GcPlayerView() {
  const { t } = useI18n();
  const id = useRouteParam("id");
  const [loading, setLoading] = useState(true);
  const [is404, setIs404] = useState(false);
  const [player, setPlayer] = useState<PlayersAPI.Player>();

  useEffect(() => {
    if (!id) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    apiPlayer(id, { signal: controller.signal })
      .then((value) => {
        setPlayer(value.data);
        setIs404(false);
        setLoading(false);
        if (typeof document !== "undefined" && value.data?.Name) {
          document.title = value.data.Name;
        }
      })
      .catch((error) => {
        if (isRequestCanceled(error)) {
          return;
        }
        setIs404(true);
        setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  if (is404) {
    return <NotFoundStatus title={t('competitionExtra.playerNotFound')} />;
  }

  if (loading) {
    return <Surface p="10" textAlign="center"><Spin description={t('competitionExtra.loading')} /></Surface>;
  }

  return (
    <div className={`${styles.playerPageRoot} competition-page`}>
      <PlayerDetail player={player} />
      <PlayerResults player={player} />
    </div>
  );
}
