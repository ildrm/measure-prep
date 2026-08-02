type Environment = Record<string, string | undefined>;

export function validateEnvironment(config: Environment) {
  const errors: string[] = [];
  const required = ["DATABASE_URL", "REDIS_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "WEB_ORIGIN", "APP_PUBLIC_URL", "MINIO_ACCESS_KEY", "MINIO_SECRET_KEY"];
  for (const key of required) if (!config[key]) errors.push(`${key} is required`);

  if (config.NODE_ENV === "production") {
    for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"]) {
      const value = config[key] ?? "";
      if (value.length < 32 || /replace|local-|change/i.test(value)) errors.push(`${key} must be a unique production secret of at least 32 characters`);
    }
    if (!config.WEB_ORIGIN?.startsWith("https://")) errors.push("WEB_ORIGIN must use HTTPS in production");
    if (!config.APP_PUBLIC_URL?.startsWith("https://")) errors.push("APP_PUBLIC_URL must use HTTPS in production");
    if ([config.DB_PASSWORD, config.DB_ROOT_PASSWORD].some((value) => !value || /^examsim/i.test(value))) errors.push("Production database passwords must replace the examples");
    if (config.MINIO_ACCESS_KEY === "minioadmin" || config.MINIO_SECRET_KEY === "minioadmin") errors.push("Production object-storage credentials must replace the examples");
    if (!config.SMTP_HOST || !config.EMAIL_FROM) errors.push("SMTP_HOST and EMAIL_FROM are required in production");
  }

  if (config.AI_SCORING_ENABLED === "true" && (!config.LLM_BASE_URL || !config.LLM_API_KEY || !config.LLM_MODEL)) errors.push("Enabled AI scoring requires LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL");
  if (errors.length) throw new Error(`Invalid environment configuration:\n- ${errors.join("\n- ")}`);
  return config;
}
