param(
    [string]$AvdName = "DockJam_API36",
    [switch]$NoBuild,
    [switch]$NoEmulator
)

$ErrorActionPreference = "Stop"

function Write-Step($Message) {
    Write-Host "==> $Message"
}

function Resolve-JavaHome {
    if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
        return $env:JAVA_HOME
    }

    $knownPaths = @(
        "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot",
        "C:\Program Files\Eclipse Adoptium\jdk-17*"
    )

    foreach ($path in $knownPaths) {
        $match = Get-Item $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($match -and (Test-Path (Join-Path $match.FullName "bin\java.exe"))) {
            return $match.FullName
        }
    }

    return $null
}

function Convert-FromLocalPropertiesPath($Value) {
    $path = $Value.Trim()
    $path = $path.Replace("\:", ":")
    return $path.Replace("\\", "\")
}

function Convert-ToLocalPropertiesPath($Value) {
    $path = $Value.Replace("\", "\\")
    return $path.Replace(":", "\:")
}

function Resolve-AndroidSdk($ProjectDir) {
    $localProperties = Join-Path $ProjectDir "local.properties"
    if (Test-Path $localProperties) {
        $line = Get-Content $localProperties | Where-Object { $_ -match "^\s*sdk\.dir\s*=" } | Select-Object -First 1
        if ($line) {
            $value = ($line -split "=", 2)[1]
            $sdkPath = Convert-FromLocalPropertiesPath $value
            if (Test-Path $sdkPath) {
                return $sdkPath
            }
        }
    }

    $candidates = @(
        $env:ANDROID_HOME,
        $env:ANDROID_SDK_ROOT,
        "C:\Android\Sdk",
        (Join-Path $env:LOCALAPPDATA "Android\Sdk")
    ) | Where-Object { $_ -and (Test-Path $_) }

    $sdk = $candidates | Select-Object -First 1
    if ($sdk) {
        $escapedSdk = Convert-ToLocalPropertiesPath $sdk
        Set-Content -Path $localProperties -Value "sdk.dir=$escapedSdk" -Encoding ASCII
        return $sdk
    }

    throw "Android SDK bulunamadi. Android Studio ile SDK kurun veya android-app\local.properties dosyasina sdk.dir ekleyin."
}

function Get-ConnectedDevice($Adb) {
    $devices = & $Adb devices | Select-String "`tdevice$"
    return $devices | Select-Object -First 1
}

function Wait-ForBoot($Adb) {
    & $Adb wait-for-device | Out-Null
    $deadline = (Get-Date).AddMinutes(4)
    while ((Get-Date) -lt $deadline) {
        $booted = (& $Adb shell getprop sys.boot_completed 2>$null).Trim()
        if ($booted -eq "1") {
            return
        }
        Start-Sleep -Seconds 3
    }
    throw "Emulator 4 dakika icinde acilmadi."
}

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

$javaHome = Resolve-JavaHome
if ($javaHome) {
    $env:JAVA_HOME = $javaHome
    $env:Path = "$javaHome\bin;$env:Path"
}

$sdk = Resolve-AndroidSdk $projectDir
$adb = Join-Path $sdk "platform-tools\adb.exe"
$emulator = Join-Path $sdk "emulator\emulator.exe"

if (!(Test-Path $adb)) {
    throw "adb bulunamadi: $adb"
}

if (!(Get-ConnectedDevice $adb)) {
    if ($NoEmulator) {
        throw "Bagli emulator veya cihaz yok."
    }

    if (!(Test-Path $emulator)) {
        throw "Emulator bulunamadi: $emulator"
    }

    Write-Step "Emulator baslatiliyor: $AvdName"
    Start-Process -FilePath $emulator -ArgumentList @("-avd", $AvdName)
    Wait-ForBoot $adb
}

if (!$NoBuild) {
    Write-Step "Debug APK build ediliyor"
    & (Join-Path $projectDir "gradlew.bat") assembleDebug
}

$apk = Join-Path $projectDir "app\build\outputs\apk\debug\app-debug.apk"
if (!(Test-Path $apk)) {
    throw "APK bulunamadi. Once build alin: .\run-app.cmd"
}

Write-Step "APK yukleniyor"
& $adb install -r $apk

Write-Step "SkinMatch aciliyor"
& $adb shell am start -n com.skinmatch.mvp/.MainActivity

Write-Host ""
Write-Host "Hazir. SkinMatch emulator/cihaz uzerinde acildi."
