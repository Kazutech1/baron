export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || "",
  mongoDb: process.env.MONGODB_DB || "loadax",
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  syncIntervalHours: Number(process.env.SYNC_INTERVAL_HOURS ?? 24),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  /** set PUBLIC_DNS=0 to keep the OS resolver (SRV lookups fail on some ISPs) */
  usePublicDns: process.env.PUBLIC_DNS !== "0",
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || "",
  /** Public URL of the storefront — used to build Paystack's callback_url */
  webUrl: process.env.WEB_URL || "http://localhost:3000",
};

export function assertConfig() {
  if (!config.mongoUri) throw new Error("MONGODB_URI is required (see .env.example)");
  if (!config.adminPassword) throw new Error("ADMIN_PASSWORD is required (see .env.example)");
  if (!config.paystackSecretKey) throw new Error("PAYSTACK_SECRET_KEY is required (see .env.example)");
}
