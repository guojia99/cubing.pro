all: start

start:
	npm run start

build:
	rm -rf dist.zip dist/
	npm run build
	zip -r -q dist.zip dist/
	rm -rf dist

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


