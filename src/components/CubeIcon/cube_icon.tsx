import './cube_icon.css'
import {SelectProps} from "antd";

export const CubeIcon = (c: string, key: string, styles: any) => {

  if (c === "" || c === undefined) {
    return <></>
  }

  c = c.replace(" ", "_")
  c = c.toLowerCase()

  let name = "cubing-icon-" + c
  return (
    <i
      key={key}
      className={"cubing-icon " + name}
      data-toggle="tooltip"
      data-placement="top"
      title={c}
      style={{
        ...styles,
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
    ></i>
  )
}




