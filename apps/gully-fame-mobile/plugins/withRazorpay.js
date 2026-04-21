/**
 * Expo Config Plugin for Razorpay
 * 
 * This plugin configures Razorpay SDK for Android and iOS
 */

const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

const withRazorpay = (config) => {
  // Android configuration
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    // Ensure manifest exists
    if (!androidManifest.manifest) {
      androidManifest.manifest = {};
    }
    
    // Add internet permission if not already present (required for Razorpay)
    if (!androidManifest.manifest.usesPermission) {
      androidManifest.manifest.usesPermission = [];
    }
    
    const hasInternetPermission = androidManifest.manifest.usesPermission.some(
      (permission) => permission.$['android:name'] === 'android.permission.INTERNET'
    );
    
    if (!hasInternetPermission) {
      androidManifest.manifest.usesPermission.push({
        $: { 'android:name': 'android.permission.INTERNET' },
      });
    }

    return config;
  });

  // iOS configuration (Razorpay iOS SDK typically doesn't need special Info.plist entries)
  // But we'll add any necessary configurations here if needed

  return config;
};

module.exports = withRazorpay;

