import React, { useRef } from 'react';
import AssociativeWordTable, { AssociativeWordTableRef } from '@/pages/Tools/Bld/comp/bld_word_table';
import { Button } from 'antd';

const BldAssociativeWords: React.FC = () => {
  const tableRef = useRef<AssociativeWordTableRef>(null);

  const handleExport = () => {
    const config = tableRef.current?.getConfig();
    console.log('配置：', config);
  };

  return (
    <div>
      <AssociativeWordTable ref={tableRef} />
      <Button onClick={handleExport} style={{ marginTop: 16 }}>
        导出配置
      </Button>
    </div>
  );
};

export default BldAssociativeWords;


// 1. 支持配置，登录可上传个人配置.
//    - 联想词配置
//    - 历史测试配置
// 2. 支持选择对应的编码， 整组配置编码
//    -
// 3. 练习模式和测试模式， 测试模式会输出测试结果。
// 4.
