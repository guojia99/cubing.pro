import "./table_style.css"

/*
<Table rowClassName={rowClassName}>
*/
export const rowClassNameWithStyleLines = (record: any, index: number) => {
  let className = 'lightitem';
  if (index % 2 === 1) className = 'darkitem';
  return className;
};


