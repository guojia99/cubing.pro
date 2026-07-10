.PHONY: start build dev

LOCAL_DEV_API_BASE := http://127.0.0.1:20000/v3/cube-api

# 本地开发（next dev，API 走线上 cubing.pro）
start:
	npm run dev

# 本地开发，API 指向本机 Go 后端（0.0.0.0:20000，见 cubing-pro make api）
dev:
	NEXT_PUBLIC_DEV_API_BASE=$(LOCAL_DEV_API_BASE) \
	CUBE_API_UPSTREAM=$(LOCAL_DEV_API_BASE) \
	npm run dev

# 静态导出到 dist/
# HowToCook 在 /tmp 缓存后同步到 public/（镜像 + git lfs），见 scripts/sync-howtocook.mjs
# 可覆盖：HOWTOCOOK_CACHE_DIR、HOWTOCOOK_MIRRORS、SKIP_HOWTOCOOK_SYNC=1
build:
	npm run build:static
