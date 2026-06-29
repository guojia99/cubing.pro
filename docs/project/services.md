# services/

> 路径：`cubing.pro/src/services/`

## 目录结构

```
services/
├── layout_config.ts              # ExtAppList()：ProLayout 外链应用
└── cubing-pro/                   # 后端 API 封装（完整列表见 api/frontend-services.md）
    ├── index.ts                  # 聚合导出 { auth, comps }
    ├── request.tsx               # Axios 实例、getAPIUrl、isLocal
    ├── otherLinksNormalize.ts    # 外链数据清洗工具函数
    ├── auth/
    │   ├── auth.ts              # 登录/注册/刷新/用户信息
    │   ├── token.ts             # Token 存取/刷新
    │   ├── admin.ts             # 管理员用户操作
    │   ├── admin_organizers.ts  # 管理员主办团队 CRUD
    │   ├── organizers.ts        # 主办端 API
    │   ├── system.ts            # 系统配置（致谢、外链）
    │   └── typings.d.ts         # AuthAPI、OrganizersAPI 等类型
    ├── comps/
    │   ├── comp.ts              # 单个比赛详情/记录
    │   ├── comps.ts             # 比赛列表搜索
    │   ├── result.ts            # 比赛成绩
    │   └── typings.d.ts         # CompAPI、CompsAPI 等类型
    ├── players/
    │   ├── players.ts           # 选手查询
    │   └── typings.d.ts         # PlayersAPI 类型
    ├── events/
    │   ├── events.ts            # 项目列表
    │   └── typings.d.ts
    ├── statistics/
    │   ├── sor.ts              # KinCh/Senior KinCh
    │   ├── records.ts          # 记录查询
    │   ├── diy_ranking.ts      # DIY 自定义榜单
    │   ├── best.ts             # 空文件（占位）
    │   └── typings.d.ts
    ├── wca/
    │   ├── player.ts           # WCA 选手 API
    │   ├── wca_api.ts          # 直连 WCA 官方 API
    │   ├── static.ts           # WCA 统计/排名
    │   ├── proportion_estimation.ts  # 成绩比例拟合
    │   ├── country.ts          # 国家列表
    │   ├── cubing_china_person.ts    # CubingChina 选手数据
    │   └── types.ts            # WCA 相关类型
    ├── algs/
    │   ├── algs.ts             # 公式组 API
    │   ├── customAlgs.ts       # 自定义公式（localStorage）
    │   ├── dailyRandomPick.ts  # 每日抽题（KV）
    │   ├── formulaPracticeConfig.ts      # 练习配置（localStorage）
    │   ├── formulaPracticeSelection.ts   # 练习选公式（localStorage）
    │   ├── formulaPracticeHistory.ts     # 练习历史（localStorage）
    │   ├── formulaPracticeProficiency.ts # 熟练度（localStorage）
    │   ├── formulaRandomPick.ts         # 随机抽公式（localStorage）
    │   ├── practiceConfigExport.ts     # 配置导入导出（localStorage）
    │   └── typings.d.ts
    ├── public/
    │   └── orgs.ts             # 公开 API（主办/致谢/外链）
    ├── pktimer/
    │   └── pktimer.ts          # PK 计时器
    ├── key_value/
    │   └── keyvalue_store.ts   # KV 高层封装
    ├── user/
    │   └── user_kv.ts          # 用户 KV 直接 API
    ├── cubing_china/
    │   └── cubing.ts            # 中国赛事列表
    └── sports/
        └── sports.ts            # 体育赛事管理
```

## layout_config.ts

| 导出 | 说明 |
|------|------|
| `ExtAppList()` | 返回 ProLayout `appList` 所需外链应用（csTimer、BLDdb、SpeedCubeDB、BLD Trainer、333fm、reco.nz、alg.cubing.net、Twizzle、VisualCube） |
