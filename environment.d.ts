declare global {
    namespace NodeJS {
        interface ProcessEnv {
            AVAIL_SEED_PHRASE: string;
            // Add other environment variables here
        }
    }
}

export {}