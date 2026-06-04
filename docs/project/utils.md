# utils/

> 路径：`cubing.pro/src/utils/`

## 目录树

```
utils/
├── aes/
│   └── aes.ts              # AES 加解密（CryptoJS）
├── time/
│   └── data_time.ts         # 日期格式化
├── types/
│   └── numbers.ts          # 数值类型判断
├── uri/
│   └── params.ts            # URL/Query 参数工具
└── websiteUiConfig.ts       # 网站UI配置（主题/字号）读写
```

## 导出函数表

| 符号 | 文件（相对 `cubing.pro/`） | 职责 |
|------|---------------------------|------|
| `aesEncrypt` | `src/utils/aes/aes.ts` | AES 加密 |
| `aesDecrypt` | `src/utils/aes/aes.ts` | AES 解密 |
| `parseDateTime` | `src/utils/time/data_time.ts` | 日期字符串 → "YYYY年MM月DD日" |
| `isNumber` | `src/utils/types/numbers.ts` | 判断是否为有效数字 |
| `GetAllQueryParams` | `src/utils/uri/params.ts` | 解析 URL 全部 query 参数 |
| `GetLocationQueryParams` | `src/utils/uri/params.ts` | 获取当前页面 query 参数 |
| `GetLocationQueryParam` | `src/utils/uri/params.ts` | 获取单个 query 参数 |
| `UpdateBrowserURL` | `src/utils/uri/params.ts` | 更新浏览器 URL query |
| `GetURLParams` | `src/utils/uri/params.ts` | 获取 query 字符串 |
| `resolveEffectiveNavTheme` | `src/utils/websiteUiConfig.ts` | 解析主题偏好（含跟随系统） |
| `readWebsiteUiFromStorage` | `src/utils/websiteUiConfig.ts` | 从 localStorage 读取 UI 配置 |
| `writeWebsiteUiToStorage` | `src/utils/websiteUiConfig.ts` | 写入 UI 配置到 localStorage |
| `applyWebsiteUiToDocument` | `src/utils/websiteUiConfig.ts` | 应用字号到 document |
| `layoutPatchFromWebsiteUi` | `src/utils/websiteUiConfig.ts` | 生成 ProLayout 补丁 |

## localStorage key

| key | 说明 |
|-----|------|
| `cubing_pro_websize_ui_config` | 网站UI配置（主题、字号） |
