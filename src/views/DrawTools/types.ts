export type PathSvg = {
  key: string;
  d?: string;
  points?: string;
  line?: {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  };
  disableStrokeWidth?: boolean;
  type?: string;
  disableDrawing?: boolean;
  baseRotate?: number;
  rotate?: number;
  rotatePoint?: string;
  translate?: number[];
  transformStr?: string;
  unColorBindKey?: string;
  text?: string;
  textSize?: number;
  textPoint?: number[];
  textRouteResetPoint?: number[];
  disShow?: boolean;
  defaultFill?: string;
};
