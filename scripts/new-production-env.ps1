param(
  [Parameter(Mandatory = $true)][string]$Domain,
  [Parameter(Mandatory = $true)][string]$SmtpHost,
  [Parameter(Mandatory = $true)][string]$SmtpUser,
  [Parameter(Mandatory = $true)][string]$SmtpPassword,
  [Parameter(Mandatory = $true)][string]$EmailFrom,
  [int]$SmtpPort = 587,
  [switch]$SmtpSecure,
  [switch]$Force
)
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$destination = Join-Path $root ".env.production"
if ((Test-Path -LiteralPath $destination) -and !$Force) { throw ".env.production already exists. Use -Force to replace it." }
function New-HexSecret([int]$Bytes) { $buffer = New-Object byte[] $Bytes; $generator = [Security.Cryptography.RandomNumberGenerator]::Create(); try { $generator.GetBytes($buffer) } finally { $generator.Dispose() }; return -join ($buffer | ForEach-Object { $_.ToString("x2") }) }
$dbPassword = New-HexSecret 24
$origin = "https://$($Domain.Trim().TrimEnd('/'))"
$values = @(
  "NODE_ENV=production",
  "APP_ENV_FILE=../.env.production",
  "DB_PASSWORD=$dbPassword",
  "DB_ROOT_PASSWORD=$(New-HexSecret 24)",
  "DATABASE_URL=mysql://examsim:$dbPassword@mysql:3306/examsim",
  "REDIS_URL=redis://redis:6379",
  "JWT_ACCESS_SECRET=$(New-HexSecret 48)",
  "JWT_REFRESH_SECRET=$(New-HexSecret 48)",
  "ACCESS_TOKEN_TTL=15m",
  "REFRESH_TOKEN_TTL_DAYS=7",
  "WEB_ORIGIN=$origin",
  "APP_PUBLIC_URL=$origin",
  "NEXT_PUBLIC_API_URL=$origin/api/v1",
  "INTERNAL_API_URL=http://api:3001/api/v1",
  "MINIO_ENDPOINT=minio",
  "MINIO_PUBLIC_ENDPOINT=$Domain",
  "MINIO_PORT=443",
  "MINIO_ACCESS_KEY=$(New-HexSecret 12)",
  "MINIO_SECRET_KEY=$(New-HexSecret 32)",
  "MINIO_BUCKET=exam-media",
  "MINIO_USE_SSL=true",
  "SMTP_HOST=$SmtpHost",
  "SMTP_PORT=$SmtpPort",
  "SMTP_SECURE=$($SmtpSecure.IsPresent.ToString().ToLowerInvariant())",
  "SMTP_USER=$SmtpUser",
  "SMTP_PASSWORD=$SmtpPassword",
  "EMAIL_FROM=$EmailFrom",
  "AI_SCORING_ENABLED=false",
  "LLM_BASE_URL=https://api.openai.com/v1",
  "LLM_API_KEY=",
  "LLM_MODEL=",
  "STT_BASE_URL=https://api.openai.com/v1",
  "STT_API_KEY=",
  "STT_MODEL=whisper-1"
)
$values | Set-Content -LiteralPath $destination -Encoding UTF8
Write-Host "Created $destination with random database, JWT, and object-storage secrets."
Write-Host "Add optional AI credentials, install trusted TLS certificates, then deploy with --env-file .env.production."
