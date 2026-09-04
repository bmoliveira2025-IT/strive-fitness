const { NativeModules, Platform } = require('react-native');

if (Platform.OS !== 'web' && NativeModules.TrackPlayerModule) {
    try {
        const TrackPlayer = require('react-native-track-player').default;
        TrackPlayer.registerPlaybackService(() => require('./service'));
    } catch (error) {
        console.log('[TrackPlayer Service Registration Error]', error);
    }
}

require('expo-router/entry');
