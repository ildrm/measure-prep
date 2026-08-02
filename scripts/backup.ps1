param([string]$Destination = "")
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backupRoot = if ($Destination) { [IO.Path]::GetFullPath($Destination) } else { Join-Path $root "backups" }
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$target = Join-Path $backupRoot $stamp
New-Item -ItemType Directory -Force -Path $target | Out-Null
$compose = Join-Path $root "infra\docker-compose.yml"
$environment = Join-Path $root ".env"
$databaseFile = Join-Path $target "database.sql"
$containerDump = "/tmp/measure-database-backup.sql"
docker compose --env-file $environment -f $compose exec -T mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers examsim > /tmp/measure-database-backup.sql'
if ($LASTEXITCODE -ne 0) { throw "Database backup failed." }
docker compose --env-file $environment -f $compose cp "mysql:$containerDump" $databaseFile
if ($LASTEXITCODE -ne 0 -or (Get-Item -LiteralPath $databaseFile).Length -lt 100) { throw "Database backup was empty or could not be copied." }

$minioContainer = (docker compose --env-file $environment -f $compose ps -q minio).Trim()
if (!$minioContainer) { throw "MinIO is not running." }
docker run --rm --volumes-from $minioContainer -v "${target}:/backup" alpine tar -czf /backup/media.tar.gz -C /data .
if ($LASTEXITCODE -ne 0) { throw "Media backup failed." }

@{ createdAt = (Get-Date).ToString("o"); database = "database.sql"; media = "media.tar.gz" } | ConvertTo-Json | Set-Content -Encoding UTF8 (Join-Path $target "manifest.json")
Write-Host "Backup complete: $target"
