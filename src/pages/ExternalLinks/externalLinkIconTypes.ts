import type { ComponentType, CSSProperties } from 'react';

export type ExternalLinkIconComp = ComponentType<{
  className?: string;
  style?: CSSProperties;
}>;

export type ExternalLinkIconEntry = {
  name: string;
  label: string;
  Icon: ExternalLinkIconComp;
};
