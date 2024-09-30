import { Comp } from '@/components/Data/types/comps';
import { rowClassNameWithStyleLines } from '@/components/Table/table_style';
import { apiComps } from '@/services/cubing-pro/comps/comps';
import { CompsAPI } from '@/services/cubing-pro/comps/typings';
import { ProTable } from '@ant-design/pro-table';
import React, { useRef, useState } from 'react';
import {CompsTableColumns} from "@/components/Data/cube_comps/comps_tables";


const Competitions: React.FC = () => {
  const actionRef = useRef();

  const [tableParams, setTableParams] = useState<CompsAPI.CompsReq>({
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

  return (
    <>
      <ProTable<Comp, CompsAPI.CompsReq>
        title={() => {
          return <h2>赛事列表</h2>;
        }}
        size="small"
        columns={CompsTableColumns}
        onReset={resetParams}
        params={tableParams}
        rowClassName={rowClassNameWithStyleLines}
        request={async (params) => {
          // todo 如果条件查询第一次查，需要把翻页重置，后续不再重置。
          // @ts-ignore
          const name = params.Name;
          setTableParams({
            ...tableParams,
            name: name,
          });
          const value = await apiComps(tableParams);
          return { data: value.data.items, success: true, total: value.data.total };
        }}
        search={{
          labelWidth: 'auto',
          defaultColsNumber: 1,
          defaultCollapsed: false,
          span: { xs: 24, sm: 24, md: 24, lg: 18, xl: 18, xxl: 12 },
        }}
        pagination={{
          showQuickJumper: true,
          current: tableParams.page,
          pageSize: tableParams.size,
        }}
        onChange={(pagination) => {
          setTableParams({
            ...tableParams,
            page: pagination.current ? pagination.current : 1,
            size: pagination.pageSize ? pagination.pageSize : 20,
          });
        }}
        options={false}
        actionRef={actionRef}
      />
    </>
  );
};

export default Competitions;
