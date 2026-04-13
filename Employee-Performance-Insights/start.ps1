$BasePath = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }

if (-not (Test-Path "$BasePath\artifacts\api-server")) {
    Write-Host "ERROR: Cannot find artifacts folder in '$BasePath'." -ForegroundColor Red
    Write-Host "Please ensure you are opening a NEW terminal in the correct project folder (Downloads\...) and running '.\start.ps1'." -ForegroundColor Yellow
    exit
}

Start-Process powershell -WorkingDirectory "$BasePath\artifacts\api-server\python_ml" -ArgumentList "-NoExit", "-Command", "C:\Users\gopal_\AppData\Local\Programs\Python\Python312\python.exe app.py"
Start-Process powershell -WorkingDirectory "$BasePath\artifacts\api-server" -ArgumentList "-NoExit", "-Command", "`$env:NODE_ENV='development'; `$env:PORT='5000'; pnpm run build; pnpm run start"
Start-Process powershell -WorkingDirectory "$BasePath\artifacts\emp-performance" -ArgumentList "-NoExit", "-Command", "`$env:PORT='5173'; `$env:BASE_PATH='/'; pnpm run dev"
