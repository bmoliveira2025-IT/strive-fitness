@echo off
"C:\\Program Files\\Microsoft\\jdk-21.0.1.12-hotspot\\bin\\java" ^
  --class-path ^
  "C:\\Users\\braul\\.gradle\\caches\\modules-2\\files-2.1\\com.google.prefab\\cli\\2.1.0\\aa32fec809c44fa531f01dcfb739b5b3304d3050\\cli-2.1.0-all.jar" ^
  com.google.prefab.cli.AppKt ^
  --build-system ^
  cmake ^
  --platform ^
  android ^
  --abi ^
  x86_64 ^
  --os-version ^
  24 ^
  --stl ^
  c++_shared ^
  --ndk-version ^
  27 ^
  --output ^
  "C:\\Users\\braul\\AppData\\Local\\Temp\\agp-prefab-staging11232653069030242965\\staged-cli-output" ^
  "C:\\Users\\braul\\.gradle\\caches\\8.14.3\\transforms\\145780e1d71abfdd0f73b65783049973\\transformed\\react-android-0.81.5-release\\prefab" ^
  "C:\\Users\\braul\\.gemini\\antigravity\\scratch\\gym_app\\mobile_app\\android\\app\\build\\intermediates\\cxx\\refs\\react-native-reanimated\\85j6l384" ^
  "C:\\Users\\braul\\.gemini\\antigravity\\scratch\\gym_app\\mobile_app\\android\\app\\build\\intermediates\\cxx\\refs\\react-native-worklets\\1n4i4y5u" ^
  "C:\\Users\\braul\\.gradle\\caches\\8.14.3\\transforms\\19343859a9f0a6124130280eb42316af\\transformed\\hermes-android-0.81.5-release\\prefab" ^
  "C:\\Users\\braul\\.gradle\\caches\\8.14.3\\transforms\\c4ed38aee617328a15ca67287b31027e\\transformed\\fbjni-0.7.0\\prefab"
