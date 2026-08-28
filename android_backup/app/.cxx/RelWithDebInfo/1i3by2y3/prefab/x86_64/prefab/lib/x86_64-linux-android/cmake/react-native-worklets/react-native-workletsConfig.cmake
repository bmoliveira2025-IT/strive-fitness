if(NOT TARGET react-native-worklets::worklets)
add_library(react-native-worklets::worklets SHARED IMPORTED)
set_target_properties(react-native-worklets::worklets PROPERTIES
    IMPORTED_LOCATION "C:/Users/braul/.gemini/antigravity/scratch/gym_app/mobile_app/node_modules/react-native-worklets/android/build/intermediates/cxx/RelWithDebInfo/3j1r6r2u/obj/x86_64/libworklets.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/braul/.gemini/antigravity/scratch/gym_app/mobile_app/node_modules/react-native-worklets/android/build/prefab-headers/worklets"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

