import apiClient from './axios';

export const testApiConnection = async () => {
  console.log('\n🧪 ========== API CONNECTION TEST ==========');
  console.log('Base URL:', apiClient.defaults.baseURL);
  console.log('Testing connection to backend...\n');
  
  try {
    const response = await apiClient.get('/', { skipAuth: true });
    
    console.log('✅ API Connection Successful!');
    console.log('Status Code:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('===========================================\n');
    
    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error: any) {
    console.error('❌ API Connection Failed!');
    console.error('Error Message:', error.message);
    console.error('Status Code:', error.status || 'N/A');
    console.error('Error Details:', error);
    console.error('===========================================\n');
    
    return {
      success: false,
      error: error.message,
      status: error.status,
    };
  }
};

if (__DEV__ && typeof global !== 'undefined') {
  (global as any).testAPI = testApiConnection;
  (global as any).testAPIAsync = async () => {
    return await testApiConnection();
  };
  console.log('\n💡 ========== API TESTING ==========');
  console.log('💡 To test API connection, run in console:');
  console.log('   testAPI().then(result => console.log(result));');
  console.log('   OR');
  console.log('   (async () => { await testAPI(); })();');
  console.log('=====================================\n');
}
