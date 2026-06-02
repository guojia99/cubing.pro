NPM_REGISTRY ?= https://registry.npmjs.org/
# 覆盖 /root/.npmrc 等全局 Nexus 配置，避免 E401
NPM_INSTALL = NPM_CONFIG_REGISTRY=$(NPM_REGISTRY) npm

all: start

start:
	$(NPM_INSTALL) run start

install:
	$(NPM_INSTALL) ci --no-audit --fund=false

build: install
	rm -rf dist.zip dist/
	BUILD_TIMESTAMP=$$(date +%s) $(NPM_INSTALL) run build
	#zip -r -q dist.zip dist/
	#rm -rf dist
# 	cp -r HowToCook dist/

run:
	make build_x
	serve -s /data/workspace/mycube-ui/build

run_go:
	make build_x
	go run main.go 3000

clean:
		export PATH=~/.npm-global/bin:$PATH
		depcheck | awk '/Unused dependencies/{flag=1;next}/Unused devDependencies/{flag=0}flag' | xargs npm uninstall
		depcheck | awk '/Unused devDependencies/{flag=1;next}flag' | xargs npm uninstall --save-dev


