export declare enum CacheStrategy {
    NONE = "none",
    MEMORY = "memory",
    LOCAL_STORAGE = "localStorage"
}
export interface PluginSystemConfig {
    PLUGINS_DIR: string;
    DEV_MODE: boolean;
    LOGGING: {
        ENABLED: boolean;
        LEVEL: 'debug' | 'info' | 'warn' | 'error';
    };
    LOADING: {
        TIMEOUT: number;
        RETRY_ATTEMPTS: number;
        RETRY_DELAY: number;
    };
    SLOTS: {
        CONTENT: string;
        SIDEBAR: string;
        FOOTER: string;
        HEADER: string;
    };
    PREVIEW: {
        ENABLED: boolean;
        PREVIEW_PLUGIN_ID?: string;
    };
    CACHE: {
        STRATEGY: CacheStrategy;
        MAX_SIZE: number;
        TTL: number;
    };
    METRICS: {
        ENABLED: boolean;
        COLLECT_LOAD_TIME: boolean;
        COLLECT_MEMORY_USAGE: boolean;
    };
}
export type PluginConfig = PluginSystemConfig;
//# sourceMappingURL=config.d.ts.map