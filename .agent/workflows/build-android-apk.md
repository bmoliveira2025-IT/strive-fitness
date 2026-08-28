---
description: Como gerar o APK Android (Release) localmente sem erros
---

Para gerar o APK de produção (Release) garantindo que não haja erros de cache ou recursos corrompidos, siga estas etapas:

### 1. Preparação de Recursos
Certifique-se de que todas as imagens em `assets/images/` são válidas. Se o build falhar com erro de "AAPT2", verifique a integridade da última imagem adicionada.

### 2. Sincronização do Projeto (Opcional)
Se houver mudanças em permissões ou plugins nativos, rode:
```bash
npx expo prebuild --platform android
```

### 3. Limpeza do Cache
// turbo
```powershell
cd android; .\gradlew.bat clean
```

### 4. Geração do APK
// turbo
```powershell
.\gradlew.bat assembleRelease
```

O APK final será gerado em: `android/app/build/outputs/apk/release/app-release.apk`

---
**Dica:** Sempre limpe o build (`clean`) antes de gerar uma nova versão para o usuário, especialmente após trocas de ícone ou imagens.
