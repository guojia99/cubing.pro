#!/usr/bin/env bash
# CI/服务器安装依赖：强制公共 npm，不依赖 Nexus 账号
set -euo pipefail
cd "$(dirname "$0")/.."

export NPM_CONFIG_REGISTRY="${NPM_CONFIG_REGISTRY:-https://registry.npmjs.org/}"
export NPM_CONFIG_ALWAYS_AUTH=false

echo "Using npm registry: ${NPM_CONFIG_REGISTRY}"
npm ci --no-audit --fund=false "$@"
