// https://umijs.org/config/
import { defineConfig } from '@umijs/max';
import { join } from 'path';

import defaultSettings from './defaultSettings';
import proxy from './proxy';
import routes from './routes';

const { REACT_APP_ENV = 'dev' } = process.env;

export default defineConfig({
  /**
   * @name 开启 hash 模式
   * @description 让 build 之后的产物包含 hash 后缀。通常用于增量发布和避免浏览器加载缓存。
   * @doc https://umijs.org/docs/api/config#hash
   */
  hash: true,

  /**
   * @name 兼容性设置
   * @description 设置 ie11 不一定完美兼容，需要检查自己使用的所有依赖
   * @doc https://umijs.org/docs/api/config#targets
   */
  // targets: {
  //   ie: 11,
  // },
  /**
   * @name 路由的配置，不在路由中引入的文件不会编译
   * @description 只支持 path，component，routes，redirect，wrappers，title 的配置
   * @doc https://umijs.org/docs/guides/routes
   */
  // umi routes: https://umijs.org/docs/routing
  routes,
  /**
   * @name 主题的配置
   * @description 虽然叫主题，但是其实只是 less 的变量设置
   * @doc antd的主题设置 https://ant.design/docs/react/customize-theme-cn
   * @doc umi 的theme 配置 https://umijs.org/docs/api/config#theme
   */
  theme: {
    // 如果不想要 configProvide 动态设置主题需要把这个设置为 default
    // 只有设置为 variable， 才能使用 configProvide 动态设置主色调
    'root-entry-name': 'variable',
  },
  /**
   * @name moment 的国际化配置
   * @description 如果对国际化没有要求，打开之后能减少js的包大小
   * @doc https://umijs.org/docs/api/config#ignoremomentlocale
   */
  ignoreMomentLocale: true,
  /**
   * @name 代理配置
   * @description 可以让你的本地服务器代理到你的服务器上，这样你就可以访问服务器的数据了
   * @see 要注意以下 代理只能在本地开发时使用，build 之后就无法使用了。
   * @doc 代理介绍 https://umijs.org/docs/guides/proxy
   * @doc 代理配置 https://umijs.org/docs/api/config#proxy
   */
  proxy: proxy[REACT_APP_ENV as keyof typeof proxy],
  /**
   * @name 快速热更新配置
   * @description 一个不错的热更新组件，更新时可以保留 state
   */
  fastRefresh: true,
  //============== 以下都是max的插件配置 ===============
  /**
   * @name 数据流插件
   * @@doc https://umijs.org/docs/max/data-flow
   */
  model: {},
  /**
   * 一个全局的初始数据流，可以用它在插件之间共享数据
   * @description 可以用来存放一些全局的数据，比如用户信息，或者一些全局的状态，全局初始状态在整个 Umi 项目的最开始创建。
   * @doc https://umijs.org/docs/max/data-flow#%E5%85%A8%E5%B1%80%E5%88%9D%E5%A7%8B%E7%8A%B6%E6%80%81
   */
  initialState: {},
  /**
   * @name layout 插件
   * @doc https://umijs.org/docs/max/layout-menu
   */
  title: 'Cubing Pro',
  layout: {
    locale: true,
    ...defaultSettings,
  },
  /**
   * @name moment2dayjs 插件
   * @description 将项目中的 moment 替换为 dayjs
   * @doc https://umijs.org/docs/max/moment2dayjs
   */
  moment2dayjs: {
    preset: 'antd',
    plugins: ['duration'],
  },
  /**
   * @name 国际化插件
   * @doc https://umijs.org/docs/max/i18n
   */
  locale: {
    // default zh-CN
    default: 'zh-CN',
    antd: true,
    // default true, when it is true, will use `navigator.language` overwrite default
    baseNavigator: true,
  },
  /**
   * @name antd 插件
   * @description 内置了 babel import 插件
   * @doc https://umijs.org/docs/max/antd#antd
   */
  antd: {},
  /**
   * @name 网络请求配置
   * @description 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
   * @doc https://umijs.org/docs/max/request
   */
  request: {},
  /**
   * @name 权限插件
   * @description 基于 initialState 的权限插件，必须先打开 initialState
   * @doc https://umijs.org/docs/max/access
   */
  access: {},
  /**
   * @name <head> 中额外的 script
   * @description 配置 <head> 中额外的 script
   */
  headScripts: [
    // 解决首次加载时白屏的问题
    { src: '/scripts/loading.js', async: true },
  ],
  //================ pro 插件配置 =================
  presets: ['umi-presets-pro'],
  /**
   * @name openAPI 插件的配置
   * @description 基于 openapi 的规范生成serve 和mock，能减少很多样板代码
   * @doc https://pro.ant.design/zh-cn/docs/openapi/
   */
  openAPI: [
    {
      requestLibPath: "import { request } from '@umijs/max'",
      // 或者使用在线的版本
      // schemaPath: "https://gw.alipayobjects.com/os/antfincdn/M%24jrzTTYJN/oneapi.json"
      schemaPath: join(__dirname, 'oneapi.json'),
      mock: false,
    },
    {
      requestLibPath: "import { request } from '@umijs/max'",
      schemaPath: 'https://gw.alipayobjects.com/os/antfincdn/CA1dOm%2631B/openapi.json',
      projectName: 'swagger',
    },
  ],
  mfsu: {
    strategy: 'normal',
  },
  esbuildMinifyIIFE: true,
  requestRecord: {},
  // chunks:['antdesigns', 'vendors', 'commons', 'umi'],
  // // chainWebpack: REACT_APP_ENV === 'local' ? undefined : webpackPlugin,
  // chainWebpack: webpackPlugin,
  // chainWebpack: function (config, { webpack }) {
  //
  //   config.merge({
  //     minimize: true,
  //     optimization: {  //webpack配置
  //       splitChunks: {
  //         chunks: 'all',
  //         minSize: 20000,
  //         minChunks: 2,
  //         cacheGroups: {
  //           vendors: {
  //             name: 'vendors',
  //             // @ts-ignore
  //             test({resource}) {
  //               return /[\\/]node_modules[\\/]/.test(resource);
  //             },
  //             priority: 10,
  //           },
  //         },
  //       },
  //     },
  //   })
  // }
  chainWebpack(config) {
    config.merge({
      optimization: {
        minimize: true,
        splitChunks: {
          chunks: 'async',
          minSize: 30000,
          minChunks: 2,
          automaticNameDelimiter: '.',
          cacheGroups: {
            vendor: {
              name: 'vendors',
              test: /^.*node_modules[\\/](?!ag-grid-|lodash|wangeditor|react-virtualized|rc-select|rc-drawer|rc-time-picker|rc-tree|rc-table|rc-calendar|antd).*$/,
              chunks: "all",
              priority: 10,
            },
            virtualized: {
              name: "virtualized",
              test: /[\\/]node_modules[\\/]react-virtualized/,
              chunks: "all",
              priority: 10
            },
            rcselect: {
              name: "rc-select",
              test: /[\\/]node_modules[\\/]rc-select/,
              chunks: "all",
              priority: 10
            },
            rcdrawer: {
              name: "rcdrawer",
              test: /[\\/]node_modules[\\/]rc-drawer/,
              chunks: "all",
              priority: 10
            },
            rctimepicker: {
              name: "rctimepicker",
              test: /[\\/]node_modules[\\/]rc-time-picker/,
              chunks: "all",
              priority: 10
            },
            ag: {
              name: "ag",
              test: /[\\/]node_modules[\\/]ag-grid-/,
              chunks: "all",
              priority: 10
            },
            antd: {
              name: "antd",
              test: /[\\/]node_modules[\\/]antd[\\/]/,
              chunks: "all",
              priority: 9
            },
            rctree: {
              name: "rctree",
              test: /[\\/]node_modules[\\/]rc-tree/,
              chunks: "all",
              priority: -1
            },
            rccalendar: {
              name: "rccalendar",
              test: /[\\/]node_modules[\\/]rc-calendar[\\/]/,
              chunks: "all",
              priority: -1
            },
            rctable: {
              name: "rctable",
              test: /[\\/]node_modules[\\/]rc-table[\\/]es[\\/]/,
              chunks: "all",
              priority: -1
            },
            wang: {
              name: "wang",
              test: /[\\/]node_modules[\\/]wangeditor[\\/]/,
              chunks: "all",
              priority: -1
            },
            lodash: {
              name: "lodash",
              test: /[\\/]node_modules[\\/]lodash[\\/]/,
              chunks: "all",
              priority: -2
            },
            bizcharts: {
              name: "bizcharts",
              test: /[\\/]node_modules[\\/]bizcharts[\\/]/,
              chunks: "all",
              priority: 10
            },
            xlsx: {
              name: "xlsx",
              test: /[\\/]node_modules[\\/]xlsx[\\/]/,
              chunks: "async",
              priority: 10
            }
          }
        }
      }
    });
    //过滤掉momnet的那些不使用的国际化文件
    config.plugin("replace").use(require("webpack").ContextReplacementPlugin).tap(() => {
      return [/moment[/\\]locale$/, /zh-cn/];
    });
  }
});
