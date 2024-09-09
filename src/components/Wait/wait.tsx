import ProSkeleton from '@ant-design/pro-skeleton';
import React from "react";

const Loading: React.FC = () => {
  return (<div style={{background: '#fafafa', padding: 24,}}><ProSkeleton type="list"/></div>)
}


export const IfLoading = (loading: boolean, children: React.ReactNode) => {
  if (loading){
    return <Loading/>
  }
  return children;
}

export default Loading;
