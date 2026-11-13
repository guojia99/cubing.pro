.PHONY: start build dev

LOCAL_DEV_API_BASE := http://0.0.0.0:20000/v3/cube-api

# 本地开发（next dev，API 走线上 cubing.pro）
start:
	npm run dev

# 本地开发，API 仅指向本机 Go 后端（0.0.0.0:20000，见 cubing-pro make api）
dev:
	NEXT_PUBLIC_DEV_API_BASE=$(LOCAL_DEV_API_BASE) \
	CUBE_API_UPSTREAM=$(LOCAL_DEV_API_BASE) \
	npm run dev

# 静态导出到 dist/（HowToCook 见 scripts/sync-howtocook.mjs）
# 指定本地目录：HOWTOCOOK_SOURCE_DIR=/path/to/HowToCook make build
# 跳过 HowToCook 同步与解析（使用仓库内已有数据）：make build SKIP_HOWTOCOOK=1
# 仅跳过同步（需 public/HowToCook 已存在）：make build SKIP_HOWTOCOOK_SYNC=1
build:
	SKIP_HOWTOCOOK=$(SKIP_HOWTOCOOK) npm run build:static
