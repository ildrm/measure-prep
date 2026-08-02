param([switch]$Force)
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$certDirectory = Join-Path $root "infra\nginx\certs"
$certificate = Join-Path $certDirectory "fullchain.pem"
$privateKey = Join-Path $certDirectory "privkey.pem"
New-Item -ItemType Directory -Force -Path $certDirectory | Out-Null
if (!$Force -and ((Test-Path $certificate) -or (Test-Path $privateKey))) { throw "Certificates already exist. Use -Force to replace the local development certificate." }
docker run --rm -v "${certDirectory}:/certs" alpine/openssl req -x509 -nodes -newkey rsa:2048 -days 30 -keyout /certs/privkey.pem -out /certs/fullchain.pem -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
if ($LASTEXITCODE -ne 0) { throw "Certificate generation failed." }
Write-Host "Created a 30-day local certificate in $certDirectory"
