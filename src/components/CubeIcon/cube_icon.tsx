import type { CSSProperties } from "react";

import "./cube_icon.css";

export const CubeIcon = (c: string, key: string, styles: CSSProperties) => {
  if (c === '' || c === undefined) {
    return <span aria-hidden />;
  }

  let cc = c.replace(' ', '_');
  cc = cc.toLowerCase();

  if (cc === 'o333bf'){
    cc = '333bf'
  }


  const name = "cubing-icon-" + cc;
  return (
    <i
      key={key}
      className={'cubing-icon ' + name}
      data-toggle="tooltip"
      data-placement="top"
      title={cc}
      style={{
        ...styles,
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
    ></i>
  );
};
