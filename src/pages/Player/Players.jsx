import { PlayerLink, WCALink } from '@/components/Link/Links';
import { apiPlayers } from '@/services/cubing-pro/players/players';
import { ProTable } from '@ant-design/pro-table';
import React, { useRef, useState } from 'react';
import { rowClassNameWithStyleLines } from "@/components/Table/table_style";
const columns = [
    {
        title: 'CubeID',
        dataIndex: 'CubeID',
        key: 'CubeID',
        width: 150,
        // @ts-ignore
        render: (value, player) => {
            return <>{PlayerLink(player.CubeID, value, '#000')}</>;
        },
        hideInSearch: true,
    },
    {
        title: '名称',
        dataIndex: 'Name',
        key: 'Name',
        // @ts-ignore
        render: (value, player) => {
            return <>{PlayerLink(player.CubeID, player.Name, 'rgb(29,177,236)')}</>;
        },
    },
    {
        title: 'WcaID',
        dataIndex: 'WcaID',
        key: 'WcaID',
        width: 150,
        // @ts-ignore
        render: (value) => {
            return WCALink(value);
        },
        hideInSearch: true,
    },
];
const Players = () => {
    const actionRef = useRef();
    const [tableParams, setTableParams] = useState({
        size: 20,
        page: 1,
        name: '',
    });
    const resetParams = () => {
        setTableParams({
            ...tableParams,
            name: '',
        });
    };
    return (<>
      <ProTable title={() => {
            return <>选手列表</>;
        }} rowClassName={rowClassNameWithStyleLines} columns={columns} onReset={resetParams} params={tableParams} request={async (params) => {
            // @ts-ignore
            const name = params.Name;
            setTableParams({
                ...tableParams,
                name: name,
            });
            const value = await apiPlayers(tableParams);
            return {
                data: value.data.items,
                success: true,
                total: value.data.total,
            };
        }} search={{
            labelWidth: 'auto',
            defaultColsNumber: 1,
            defaultCollapsed: false,
            span: { xs: 24, sm: 24, md: 24, lg: 18, xl: 18, xxl: 12 },
        }} pagination={{
            showQuickJumper: true,
            current: tableParams.page,
            pageSize: tableParams.size,
        }} onChange={(pagination) => {
            setTableParams({
                name: tableParams.name,
                page: pagination.current ? pagination.current : 1,
                size: pagination.pageSize ? pagination.pageSize : 20,
            });
        }} options={false} actionRef={actionRef} sticky/>
    </>);
};
export default Players;
//# sourceMappingURL=Players.jsx.map