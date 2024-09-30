
import { useEffect } from "react";

// @ts-ignore
function UpdateTitle({ title }) {
  useEffect(() => {
    // 修改页面的标题
    document.title = title;
  }, [title]); // 依赖 title，当 title 变化时更新标题

  return null;
}

export default UpdateTitle;
