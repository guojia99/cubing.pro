all: start

start:
	npm run start

build:
	npm run build
	zip -r -q dist.zip dist/
	rm -rf dist

run:
	make build_x
	serve -s /data/workspace/mycube-ui/build

run_go:
	make build_x
	go run main.go 3000
