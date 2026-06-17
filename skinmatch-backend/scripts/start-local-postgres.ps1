param(
    [int]$Port = 55432,
    [string]$Database = "skincare_dev",
    [string]$User = "skincare",
    [string]$DataDir = ""
)

$ErrorActionPreference = "Stop"

function Write-Step($Message) {
    Write-Host "==> $Message"
}

function Resolve-Tool($Name) {
    $command = Get-Command "$Name.exe" -ErrorAction SilentlyContinue
    if (!$command) {
        throw "$Name.exe was not found on PATH. Install PostgreSQL or add its bin directory to PATH."
    }
    return $command.Source
}

if (!$DataDir) {
    $DataDir = Join-Path $env:LOCALAPPDATA "SkinMatch\postgres-$Port"
}

$initdb = Resolve-Tool "initdb"
$pgCtl = Resolve-Tool "pg_ctl"
$createdb = Resolve-Tool "createdb"
$psql = Resolve-Tool "psql"
$logFile = Join-Path $DataDir "postgres.log"

New-Item -ItemType Directory -Force -Path $DataDir | Out-Null

if (!(Test-Path (Join-Path $DataDir "PG_VERSION"))) {
    Write-Step "Initializing local PostgreSQL cluster in $DataDir"
    & $initdb -D $DataDir -U $User -A trust -E UTF8 --locale=C
}

$listener = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    Where-Object { $_.State -eq "Listen" } |
    Select-Object -First 1

if (!$listener) {
    Write-Step "Starting PostgreSQL on 127.0.0.1:$Port"
    & $pgCtl -D $DataDir -l $logFile -o "-p $Port" start
} else {
    Write-Step "PostgreSQL listener already exists on port $Port"
}

$env:PGPASSWORD = $User
$escapedDatabase = $Database.Replace("'", "''")
$databaseExists = (& $psql -h 127.0.0.1 -p $Port -U $User -d postgres -tAc "select 1 from pg_database where datname = '$escapedDatabase';" 2>$null).Trim()
if ($databaseExists -ne "1") {
    Write-Step "Creating database $Database"
    & $createdb -h 127.0.0.1 -p $Port -U $User $Database
}

Write-Step "Verifying database connection"
& $psql -h 127.0.0.1 -p $Port -U $User -d $Database -c "select current_database(), current_user;"

Write-Host ""
Write-Host "Use this DATABASE_URL in skinmatch-backend/.env:"
Write-Host "postgresql://${User}:${User}@127.0.0.1:${Port}/${Database}?schema=public"
