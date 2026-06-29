# components/

> 路径：`cubing.pro/src/components/`

## 目录树

```
components/
├── index.ts                       # 聚合导出：Footer、AvatarDropdown、AvatarName
├── NavThemeSwitch.tsx              # 导航主题切换（明/暗/系统）
├── TokenCallbackHandler.tsx         # Token 回调包裹组件
├── Admin/
│   └── AdminUserSearchSelect.tsx    # 管理员用户搜索下拉
├── Alert/
│   └── toast.tsx                   # 全局 Toast 提示
├── background/
│   └── WaveBackground.tsx          # 波浪背景
├── Buttons/
│   ├── back_button.tsx              # 返回按钮
│   ├── copy_btn.tsx                 # 复制按钮
│   ├── pagination_button.tsx        # 分页按钮
│   └── toTop.tsx                    # 回到顶部
├── CubeIcon/
│   ├── cube.ts                      # 魔方项目常量
│   ├── cube_icon.tsx               # 魔方项目图标组件
│   ├── cube_map.ts                  # 项目名 → 图标映射
│   ├── cube_icon_map.css
│   ├── cube_icon.css
│   ├── cubing-icons.woff/woff2/ttf # 魔方图标字体
│   └── cube_icon.py                 # 图标生成脚本
├── Data/
│   └── table_fixed_column.css        # 表格固定列样式
├── Footer/
│   └── index.tsx                    # 页脚组件（备案号、版权）
├── HeaderDropdown/
│   └── index.tsx                    # 头部下拉菜单
├── Inputs/
│   └── password.tsx                 # 密码输入框
├── Link/
│   └── Links.tsx                    # 链接组件
├── Markdown/
│   ├── Markdown.tsx                 # Markdown 渲染
│   ├── editer.tsx                   # Markdown 编辑器
│   ├── editor_view.css
│   ├── github-markdown.css
│   └── rainbow.css
├── Status/
│   └── 404.tsx                      # 404 状态展示
├── Table/
│   ├── table_style.tsx              # 表格样式封装
│   └── table_style.css
├── Tabs/
│   ├── tabs.tsx                     # 标签页
│   ├── nav_tabs.tsx                 # 导航式标签
│   └── tabs.css
├── Title/
│   └── Title.tsx                    # 页面标题
├── UserData/
│   ├── UserCloudKvPanel.tsx         # 用户 KV 云同步面板
│   └── UserKvUploadProgress.tsx      # KV 上传进度
└── Wait/
    └── wait.tsx                     # 加载等待
```

## 聚合导出（index.ts）

| 导出 | 来源 | 说明 |
|------|------|------|
| `Footer` | `Footer/index.tsx` | 页脚 |
| `AvatarDropdown` | `pages/Admin/AvatarDropdown.tsx` | 头像下拉菜单（登录/登出/WCA 登录） |
| `AvatarName` | `pages/Admin/AvatarDropdown.tsx` | 用户名展示 |
