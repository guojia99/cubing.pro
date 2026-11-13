"use client";

import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import type { ReactNode } from "react";
import "./groupCompetition.css";

export function GroupCompetitionShell({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return <Box className="group-competition" maxW="1440px" mx="auto" w="full">
    <Stack gap="2" mb="5"><Heading size="xl">{title}</Heading>{description && <Text color="fg.muted">{description}</Text>}</Stack>
    <ConfigProvider locale={zhCN} button={{ autoInsertSpace: false }} theme={{ token: { colorPrimary: "#168ca8", colorInfo: "#168ca8", borderRadius: 12 }, components: { Table: { headerBg: "#edf8fc", headerColor: "#164e63" }, Card: { headerBg: "#f1fafe" } } }}>
      {children}
    </ConfigProvider>
  </Box>;
}
