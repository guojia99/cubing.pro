"use client";

import "antd/dist/reset.css";
import "flag-icons/css/flag-icons.min.css";

import { Col, Row, Spin } from "antd";
import { useRouteParam } from "@/hooks/useRouteParam";
import { useEffect, useState } from "react";

import { useIntlMessage } from "@/hooks/useIntlMessage";
import WCAPlayerDetails from "@/views/Wca/PlayerComponents/PlayerDetails";
import WCAPlayerResultTable from "@/views/Wca/PlayerComponents/PlayerResultTable";
import WCAPlayerStaticsTab from "@/views/Wca/PlayerComponents/WCAPlayerStaticsTab";
import {
  GetPlayerRankTimers,
  getWCAPersonCompetitions,
  getWCAPersonProfile,
  getWCAPersonResults,
} from "@/services/cubing-pro/wca/player";
import type {
  StaticWithTimerRank,
  WCACompetition,
  WcaProfile,
  WCAResult,
} from "@/services/cubing-pro/wca/types";
import { apiGetWCAPersonProfile } from "@/services/cubing-pro/wca/wca_api";

const notAvatarUrl =
  "https://assets.worldcubeassociation.org/assets/062b138/assets/missing_avatar_thumb-d77f478a307a91a9d4a083ad197012a391d5410f6dd26cb0b0e3118a5de71438.png";
const banAvatarKey = ["2016XUWE02"];

export function WcaPlayerView() {
  const wcaId = useRouteParam("wcaId") ?? "";
  const intl = useIntlMessage();

  const [is404, setIs404] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wcaProfile, setWcaProfile] = useState<WcaProfile>();
  const [wcaResults, setWcaResults] = useState<WCAResult[]>([]);
  const [comps, setComps] = useState<WCACompetition[]>([]);
  const [wcaRankTimer, setWcaRankTimer] = useState<StaticWithTimerRank[]>([]);

  useEffect(() => {
    if (!loading && wcaProfile?.name) {
      document.title = intl.formatMessage(
        { id: "wca.player.pageTitle" },
        { name: wcaProfile.name },
      );
    }
  }, [loading, wcaProfile?.name, intl]);

  useEffect(() => {
    if (!wcaId) {
      setLoading(false);
      setIs404(true);
      return;
    }

    let cancelled = false;

    const fetchPlayer = async () => {
      setLoading(true);
      try {
        const [profileRes, compsRes, resultsRes, rankTimers] = await Promise.all([
          getWCAPersonProfile(wcaId),
          getWCAPersonCompetitions(wcaId),
          getWCAPersonResults(wcaId),
          GetPlayerRankTimers(wcaId),
        ]);

        if (cancelled) return;

        if (banAvatarKey.includes(wcaId)) {
          profileRes.thumb_url = notAvatarUrl;
        }

        setWcaProfile(profileRes);
        setComps(compsRes);
        setWcaResults(resultsRes);
        setWcaRankTimer(rankTimers);
        setIs404(false);

        void apiGetWCAPersonProfile(wcaId)
          .then((res) => {
            if (cancelled) return;
            setWcaProfile((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                thumb_url: res.person?.avatar?.thumb_url || prev.thumb_url,
              };
            });
          })
          .catch(() => {});
      } catch {
        if (!cancelled) {
          setIs404(true);
          setWcaProfile(undefined);
          setComps([]);
          setWcaResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchPlayer();

    return () => {
      cancelled = true;
    };
  }, [wcaId]);

  if (is404) {
    return (
      <div style={{ textAlign: "center", color: "var(--faint-foreground)", marginTop: 50 }}>
        {intl.formatMessage({ id: "wca.player.notFound" })}
      </div>
    );
  }

  if (loading || !wcaProfile) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <Spin
          size="large"
          description={intl.formatMessage({ id: "wca.player.loading" })}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 16px",
        boxSizing: "border-box",
      }}
    >
      <Row gutter={[0, 24]}>
        <Col xs={24} sm={24} md={24} lg={24}>
          <WCAPlayerDetails wcaProfile={wcaProfile} wcaResults={wcaResults} />
        </Col>
        <Col xs={24} sm={24} md={24} lg={24}>
          <WCAPlayerResultTable wcaProfile={wcaProfile} wcaResults={wcaResults} />
        </Col>
        <Col xs={24} sm={24} md={24} lg={24}>
          <WCAPlayerStaticsTab
            wcaProfile={wcaProfile}
            wcaResults={wcaResults}
            comps={comps}
            wcaRankTimer={wcaRankTimer}
          />
        </Col>
      </Row>
    </div>
  );
}
