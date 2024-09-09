import {Button, Result} from "antd";
import {Link} from "@umijs/max";

export const P404 = (title: string) => {
  return (
    <Result
      title={title}
      icon={<></>}
      status={"404"}
      extra={
        <>
          <img
            src="/404.webp"
            alt="404"
            style={{width: "300px", height: "auto", marginBottom: "30px"}} // 修改图片大小
          />
          <br/>
          <Link to={"/"}>
            <Button type="primary">
              回到首页
            </Button>
          </Link>
        </>


      }
    />
  )
}
