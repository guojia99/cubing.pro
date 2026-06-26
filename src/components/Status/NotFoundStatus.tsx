"use client";

import { Button, Result } from "antd";
import NextLink from "next/link";

export function NotFoundStatus({ title }: { title: string }) {
  return (
    <Result
      title={title}
      icon={<></>}
      status="404"
      extra={
        <>
          <img
            src="/404.webp"
            alt="404"
            style={{ width: 300, height: "auto", marginBottom: 30 }}
          />
          <br />
          <NextLink href="/">
            <Button type="primary">回到首页</Button>
          </NextLink>
        </>
      }
    />
  );
}
