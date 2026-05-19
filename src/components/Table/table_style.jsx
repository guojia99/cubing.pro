import "./table_style.css";
/*
<Table rowClassName={rowClassName}>
*/
export const rowClassNameWithStyleLines = (record, index) => {
    let className = 'lightitem';
    if (index % 2 === 1)
        className = 'darkitem';
    return className;
};
//# sourceMappingURL=table_style.jsx.map