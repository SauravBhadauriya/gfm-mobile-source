export const checkDevMode = () => {
  const isDev = __DEV__;
  
  console.log('\n🔍 ========== DEVELOPMENT MODE CHECK ==========');
  console.log('__DEV__ value:', isDev);
  console.log('Environment:', isDev ? 'DEVELOPMENT' : 'PRODUCTION');
  
  if (isDev) {
    console.log('✅ You are in DEVELOPMENT mode');
    console.log('✅ API logs will be visible');
    console.log('✅ testAPI() function is available globally');
  } else {
    console.log('⚠️ You are in PRODUCTION mode');
    console.log('⚠️ API logs are disabled');
    console.log('⚠️ testAPI() function is not available');
  }
  
  console.log('===========================================\n');
  
  return isDev;
};

if (typeof global !== 'undefined') {
  (global as any).checkDevMode = checkDevMode;
}

