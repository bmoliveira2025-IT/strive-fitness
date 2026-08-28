@echo off
"C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\java" ^
  --class-path ^
  "C:\\Users\\braul\\.gradle\\caches\\modules-2\\files-2.1\\com.google.prefab\\cli\\2.1.0\\aa32fec809c44fa531f01dcfb739b5b3304d3050\\cli-2.1.0-all.jar" ^
  com.google.prefab.cli.AppKt ^
  --build-system ^
  cmake ^
  --platform ^
  android ^
  --abi ^
  x86 ^
  --os-version ^
  24 ^
  --stl ^
  c++_shared ^
  --ndk-version ^
  27 ^
  --output ^
  "C:\\Users\\braul\\AppData\\Local\\Temp\\agp-prefab-staging17451770594014173738\\staged-cli-output" ^
  "C:\\Users\\braul\\.gradle\\caches\\8.14.3\\transforms\\b2680b08f1e2cb52f3dff51eef1dacfb\\transformed\\react-android-0.81.5-debug\\prefab" ^
  "C:\\gym\\android\\app\\build\\intermediates\\cxx\\refs\\react-native-reanimated\\85j6l384" ^
  "C:\\gym\\android\\app\\build\\intermediates\\cxx\\refs\\react-native-worklets\\2r733710" ^
  "C:\\Users\\braul\\.gradle\\caches\\8.14.3\\transforms\\9f8bf174426a62033c5396f3e1842ab7\\transformed\\hermes-android-0.81.5-debug\\prefab" ^
  "C:\\Users\\braul\\.gradle\\caches\\8.14.3\\transforms\\c4ed38aee617328a15ca67287b31027e\\transformed\\fbjni-0.7.0\\prefab"
