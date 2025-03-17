import { Card } from 'antd';
import React, {useEffect} from 'react';
import AnalyseAlg from "./bld_helper";


const MBldPracticeTools: React.FC = () => {
  const [data, setData] = React.useState();
  useEffect(() => {
    // setData(AnalyseAlg("R U", "J", "GCEOKQSYIWM", "A", "GADXWRO"))
    // console.log(data)
  }, []);

  return (
    <div style={{ margin: 'auto', textAlign: 'center', padding: '20px' }}>
      <Card title={'多盲记忆练习工具'} style={{ marginBottom: 20 }}>
        {data}


      </Card>
    </div>
  );
};

export default MBldPracticeTools;
