"use client";

import { VStack } from "@chakra-ui/react";

import { AdvertisementCarousel } from "@/views/Welcome/AdvertisementCarousel";
import { BuyCoffeeQuickJump } from "@/views/Welcome/BuyCoffeeQuickJump";
import { WelcomeView as WelcomeInfoCards } from "@/views/Welcome/WelcomeInfoCards";
import { ThanksSection } from "@/views/Welcome/ThanksSection";
import { ExternalLinksHomeSection } from "@/views/ExternalLinks/ExternalLinksHomeSection";

export function WelcomePageView() {
  return (
    <VStack align="stretch" gap="0">
      <ThanksSection />
      <ExternalLinksHomeSection />
      <BuyCoffeeQuickJump />
      <AdvertisementCarousel />
      <WelcomeInfoCards />
    </VStack>
  );
}
