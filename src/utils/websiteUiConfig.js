const STORAGE_KEY = 'cubing_pro_websize_ui_config';
/** 解析为 ProLayout 实际可用的 navTheme */
export function resolveEffectiveNavTheme(cfg) {
    const t = cfg.navTheme;
    if (t === 'realDark')
        return 'realDark';
    if (t === 'light')
        return 'light';
    if (t === 'system') {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'realDark' : 'light';
        }
        return 'light';
    }
    return 'light';
}
export function readWebsiteUiFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return {};
        const v = JSON.parse(raw);
        return v && typeof v === 'object' ? v : {};
    }
    catch {
        return {};
    }
}
export function writeWebsiteUiToStorage(cfg) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    }
    catch {
        // ignore
    }
}
export function applyWebsiteUiToDocument(cfg) {
    if (typeof document === 'undefined')
        return;
    const px = cfg.fontSizeBase;
    if (typeof px === 'number' && px >= 12 && px <= 22) {
        document.documentElement.style.fontSize = `${px}px`;
    }
    else {
        document.documentElement.style.fontSize = '';
    }
}
/** 合并到 ProLayout / initialState.settings（始终写入解析后的 light / realDark） */
export function layoutPatchFromWebsiteUi(cfg) {
    return {
        navTheme: resolveEffectiveNavTheme(cfg),
    };
}
//# sourceMappingURL=websiteUiConfig.js.map