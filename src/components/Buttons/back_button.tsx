"use client";

import { Button } from "antd";
import { useRouter } from "next/navigation";

export default function BackButton(name: string) {
  const router = useRouter();

  return (
    <Button type="default" onClick={() => router.back()} style={{ marginBottom: "20px" }}>
      {name}
    </Button>
  );
}
