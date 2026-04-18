$ErrorActionPreference = 'Stop'

$hubDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = if ($env:REPO_FOUNDRY_PORT) { $env:REPO_FOUNDRY_PORT } elseif ($env:REPOS_HUB_PORT) { $env:REPOS_HUB_PORT } else { '4789' }
$tailscaleExe = 'C:\Program Files\Tailscale\tailscale.exe'
$logsDir = Join-Path $hubDir 'logs'
$outLog = Join-Path $logsDir 'repo-foundry.out.log'
$errLog = Join-Path $logsDir 'repo-foundry.err.log'
$pidFile = Join-Path $logsDir 'repo-foundry.pid'
$waitSeconds = 120

function Get-TailscaleIp {
    if (Test-Path $tailscaleExe) {
        try {
            $lines = & $tailscaleExe ip -4 2>$null
            $ip = $lines | Where-Object { $_ -and $_.Trim() } | Select-Object -First 1
            if ($ip) {
                return $ip.Trim()
            }
        } catch {
        }
    }

    try {
        $fallbackIp = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
            Where-Object { $_.IPAddress -like '100.*' } |
            Select-Object -First 1 -ExpandProperty IPAddress
        if ($fallbackIp) {
            return $fallbackIp.Trim()
        }
    } catch {
        return $null
    }

    return $null
}

function Test-UrlHealthy {
    param(
        [string]$Url,
        [int]$TimeoutSec = 5
    )

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec $TimeoutSec
        return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500)
    } catch {
        return $false
    }
}

function Stop-TrackedProcess {
    if (-not (Test-Path $pidFile)) {
        return
    }

    $rawPid = Get-Content -Path $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
    $trackedPid = 0
    if (-not [int]::TryParse($rawPid, [ref]$trackedPid)) {
        Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
        return
    }

    $process = Get-Process -Id $trackedPid -ErrorAction SilentlyContinue
    if ($process) {
        try {
            Stop-Process -Id $trackedPid -Force -ErrorAction Stop
        } catch {
            Write-Warning "Could not stop tracked Repo Foundry process ${trackedPid}: $($_.Exception.Message)"
        }
    }

    Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
}

function Stop-PortListeners {
    param(
        [int]$Port,
        [string[]]$Addresses
    )

    $targetAddresses = @($Addresses | Where-Object { $_ })
    if (-not $targetAddresses) {
        return
    }

    $listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -eq $Port -and $_.LocalAddress -in $targetAddresses } |
        Sort-Object OwningProcess -Unique

    foreach ($listener in $listeners) {
        try {
            Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop
        } catch {
            Write-Warning "Could not stop Repo Foundry listener $($listener.OwningProcess) on $($listener.LocalAddress):${Port}"
        }
    }
}

if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

$bindHosts = @('127.0.0.1')
$tailscaleIp = Get-TailscaleIp
if ($tailscaleIp) {
    $bindHosts += $tailscaleIp
}

$healthUrls = @($bindHosts | ForEach-Object { "http://${_}:$port/api/internal/meta" })

$alreadyHealthy = $true
foreach ($healthUrl in $healthUrls) {
    if (-not (Test-UrlHealthy -Url $healthUrl)) {
        $alreadyHealthy = $false
        break
    }
}

if ($alreadyHealthy) {
    Write-Host "Repo Foundry already running on port $port"
    exit 0
}

Stop-TrackedProcess
Stop-PortListeners -Port ([int]$port) -Addresses $bindHosts

$pythonCmd = if (Get-Command py -ErrorAction SilentlyContinue) { 'py' } else { 'python' }
$pythonLaunch = if ($pythonCmd -eq 'py') {
    "& py -3 '$hubDir\\hub_server.py'"
} else {
    "& python '$hubDir\\hub_server.py'"
}

$launchCommand = @(
    ('$env:REPO_FOUNDRY_PORT=''' + $port + ''''),
    ('$env:REPO_FOUNDRY_HOSTS=''' + ($bindHosts -join ',') + ''''),
    $pythonLaunch
) -join '; '

$process = Start-Process -FilePath 'powershell.exe' `
    -ArgumentList @('-NoProfile', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-Command', $launchCommand) `
    -WorkingDirectory $hubDir `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -WindowStyle Hidden `
    -PassThru

Set-Content -Path $pidFile -Value $process.Id

$deadline = (Get-Date).AddSeconds($waitSeconds)
while ((Get-Date) -lt $deadline) {
    $allHealthy = $true
    foreach ($healthUrl in $healthUrls) {
        if (-not (Test-UrlHealthy -Url $healthUrl)) {
            $allHealthy = $false
            break
        }
    }

    if ($allHealthy) {
        Write-Host "Repo Foundry ready on port $port"
        exit 0
    }

    if ($process.HasExited) {
        throw "Repo Foundry exited early. See $errLog."
    }

    Start-Sleep -Seconds 2
}

try {
    Stop-Process -Id $process.Id -Force -ErrorAction Stop
} catch {
    Write-Warning "Could not stop unresponsive Repo Foundry process $($process.Id): $($_.Exception.Message)"
}

throw "Repo Foundry health checks did not pass within the startup window. See $outLog and $errLog."
