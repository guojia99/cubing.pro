import './cube_icon.css';

export const CubeIcon = (c: string, key: string, styles: any) => {
  if (c === '' || c === undefined) {
    return <></>;
  }

  let cc = c.replace(' ', '_');
  cc = cc.toLowerCase();

  let name = 'cubing-icon-' + cc;
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
