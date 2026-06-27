.PHONY: start build

# 本地开发（next dev，含 API 代理）
start:
	npm run dev

# 静态导出到 dist/
build:
	npm run build:static
