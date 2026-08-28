# Script para habilitar Long Paths no Windows
# Execute como Administrador: Clique com botão direito e escolha "Executar como administrador"

Write-Host "Habilitando suporte a Long Paths no Windows..." -ForegroundColor Cyan

try {
    # Habilitar no registro
    New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
        -Name "LongPathsEnabled" `
        -Value 1 `
        -PropertyType DWORD `
        -Force | Out-Null
    
    Write-Host "✓ Long Paths habilitado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Agora execute o build:" -ForegroundColor Yellow
    Write-Host "  cd android" -ForegroundColor White
    Write-Host "  .\gradlew.bat assembleRelease" -ForegroundColor White
    Write-Host ""
    Write-Host "O APK será gerado em:" -ForegroundColor Yellow
    Write-Host "  android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor White
}
catch {
    Write-Host "✗ ERRO: Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Como executar:" -ForegroundColor Yellow
    Write-Host "1. Clique com botão direito neste arquivo" -ForegroundColor White
    Write-Host "2. Escolha 'Executar como administrador'" -ForegroundColor White
    Write-Host "3. Clique em 'Sim' quando o Windows pedir confirmação" -ForegroundColor White
}

Read-Host "Pressione Enter para fechar"
