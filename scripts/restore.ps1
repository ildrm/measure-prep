param([Parameter(Mandatory = $true)][string]$BackupDirectory, [switch]$ConfirmRestore)
$ErrorActionPreference = "Stop"
if (!$ConfirmRestore) { throw "Restore replaces database contents. Re-run with -ConfirmRestore after confirming the target stack." }
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$source = (Resolve-Path -LiteralPath $BackupDirectory).Path
$databaseFile = Join-Path $source "database.sql"
$mediaFile = Join-Path $source "media.tar.gz"
if (!(Test-Path -LiteralPath $databaseFile) -or !(Test-Path -LiteralPath $mediaFile)) { throw "The backup directory must contain database.sql and media.tar.gz." }
$compose = Join-Path $root "infra\docker-compose.yml"
$environment = Join-Path $root ".env"
$containerRestore = "/tmp/measure-database-restore.sql"
docker compose --env-file $environment -f $compose cp $databaseFile "mysql:$containerRestore"
if ($LASTEXITCODE -ne 0) { throw "Database restore file could not be copied." }
docker compose --env-file $environment -f $compose exec -T mysql sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" examsim < /tmp/measure-database-restore.sql'
if ($LASTEXITCODE -ne 0) { throw "Database restore failed." }

$minioContainer = (docker compose --env-file $environment -f $compose ps -q minio).Trim()
if (!$minioContainer) { throw "MinIO is not running." }
docker run --rm --volumes-from $minioContainer -v "${source}:/backup:ro" alpine tar -xzf /backup/media.tar.gz -C /data
if ($LASTEXITCODE -ne 0) { throw "Media restore failed." }
Write-Host "Restore complete. Restart the API and web services before use."
