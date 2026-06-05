"use client";

import { Box, Button, Dialog, Heading, Portal, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import {
  acknowledgeCocktailSafety,
  hasAcknowledgedCocktailSafety,
} from "../utils/cocktailSafetyAck";

export function CocktailFirstVisitModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasAcknowledgedCocktailSafety()) setOpen(true);
  }, []);

  const handleOk = () => {
    acknowledgeCocktailSafety();
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={() => {}} closeOnInteractOutside={false} closeOnEscape={false} size="md">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>饮酒与使用提示</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="stretch" gap="4">
                <Box>
                  <Heading size="sm" mb="2">
                    1. 年龄提示
                  </Heading>
                  <Text fontSize="14px">
                    <strong>未满 18 周岁请勿饮酒。</strong>本页面涉及酒类信息，请确认您已年满 18 周岁。
                  </Text>
                </Box>
                <Box>
                  <Heading size="sm" mb="2">
                    2. 免责声明
                  </Heading>
                  <Text fontSize="14px">
                    本页鸡尾酒配方、调制说明等内容仅供<strong>文化交流与学习参考</strong>，不构成任何饮酒建议、推销或引导。
                    过量饮酒危害健康；请勿酒后驾车或从事需注意安全的活动。因个人体质、健康状况、饮酒行为等产生的任何后果，均由使用者自行承担，本站及开发者不承担责任。
                  </Text>
                </Box>
                <Box>
                  <Heading size="sm" mb="2">
                    3. 本地数据说明
                  </Heading>
                  <Text fontSize="14px">
                    「今晚喝什么」清单、收藏、转盘相关记录等功能会将数据<strong>保存在您当前浏览器的本地存储</strong>中，用于在同一设备、同一浏览器内再次访问时恢复状态；<strong>不会</strong>作为上述业务数据上传至本站服务器。清除站点数据或更换浏览器后可能丢失，请知悉。
                  </Text>
                </Box>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button colorPalette="brand" width="full" size="lg" onClick={handleOk}>
                我已阅读并知晓
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
