import { Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserKycStatus } from '../api/services/userService';
import { getCurrentUser } from '../api/services/userService';

/**
 * Check if all required KYC steps are completed
 * Required steps: Bio, Profile Image, Face Scan, Date of Birth, Gender
 */
export async function areAllKycStepsCompleted(): Promise<boolean> {
  try {
    // Get user profile data
    const userResult = await getCurrentUser();
    const user = userResult.success ? userResult.data : null;
    
    // Check all required fields
    const hasBio = user?.bio && user.bio.trim().length > 0;
    const hasImage = user?.profileImage && user.profileImage.length > 0;
    const hasDob = user?.dob && user.dob.trim().length > 0;
    const hasGender = user?.gender && user.gender.trim().length > 0;
    
    // Check face scan from AsyncStorage
    const faceScanDone = await AsyncStorage.getItem('faceScanDone');
    const hasFaceScan = faceScanDone === 'true';
    
    // All steps must be completed
    const allCompleted = hasBio && hasImage && hasDob && hasGender && hasFaceScan;
    
    if (__DEV__) {
      console.log('[kycValidation] KYC Steps Check:', {
        hasBio,
        hasImage,
        hasDob,
        hasGender,
        hasFaceScan,
        allCompleted,
      });
    }
    
    return allCompleted;
  } catch (error) {
    console.error('[kycValidation] Error checking KYC steps:', error);
    return false;
  }
}

/**
 * Automatically verify KYC if all steps are completed
 * Updates KYC status to "completed" on backend
 */
export async function autoVerifyKycIfComplete(): Promise<boolean> {
  try {
    const allStepsCompleted = await areAllKycStepsCompleted();
    
    if (!allStepsCompleted) {
      if (__DEV__) {
        console.log('[kycValidation] Not all KYC steps completed, skipping auto-verification');
      }
      return false;
    }
    
    // Check current KYC status
    const kycResult = await getUserKycStatus();
    const currentStatus = kycResult.success && kycResult.data ? kycResult.data.status : null;
    
    // If already completed/approved, no need to update
    if (currentStatus === 'completed' || currentStatus === 'approved') {
      if (__DEV__) {
        console.log('[kycValidation] KYC already completed/approved');
      }
      return true;
    }
    
    // Auto-verify by updating profile with isVerified flag
    // The backend should automatically set KYC status to "completed" when all steps are done
    if (__DEV__) {
      console.log('[kycValidation] All steps completed, KYC should be automatically verified');
      console.log('[kycValidation] Backend should set status to "completed" when all required fields are present');
    }
    
    return true;
  } catch (error) {
    console.error('[kycValidation] Error in auto-verification:', error);
    return false;
  }
}

/**
 * Check if user's KYC is completed/approved
 * Returns true if KYC is completed or approved, false otherwise
 * Now also checks if all steps are completed locally
 */
export async function isKycCompleted(): Promise<boolean> {
  try {
    // First check if all steps are completed locally
    const allStepsCompleted = await areAllKycStepsCompleted();
    
    if (allStepsCompleted) {
      // If all steps are done, try to auto-verify
      await autoVerifyKycIfComplete();
      
      // Check backend status
      const result = await getUserKycStatus();
      
      if (result.success && result.data) {
        const status = result.data.status;
        // Consider it completed if status is "completed" or "approved", OR if all steps are done
        return status === 'completed' || status === 'approved' || allStepsCompleted;
      }
      
      // If backend doesn't have KYC but all steps are done, consider it completed
      return allStepsCompleted;
    }
    
    // If not all steps are done, check backend status
    const result = await getUserKycStatus();
    
    if (result.success && result.data) {
      const status = result.data.status;
      return status === 'completed' || status === 'approved';
    }
    
    return false;
  } catch (error) {
    console.error('[kycValidation] Error checking KYC status:', error);
    return false;
  }
}

/**
 * Get the first incomplete KYC step
 * Returns the step name that needs to be completed, or null if all are done
 * Steps order: dob, gender, bio, image, faceScan
 */
export async function getFirstIncompleteStep(): Promise<string | null> {
  try {
    const userResult = await getCurrentUser();
    const user = userResult.success ? userResult.data : null;
    
    // Check each step in order
    const hasDob = user?.dob && user.dob.trim().length > 0;
    if (!hasDob) return 'dob';
    
    const hasGender = user?.gender && user.gender.trim().length > 0;
    if (!hasGender) return 'gender';
    
    const hasBio = user?.bio && user.bio.trim().length > 0;
    if (!hasBio) return 'bio';
    
    const hasImage = user?.profileImage && user.profileImage.length > 0;
    if (!hasImage) return 'image';
    
    const faceScanDone = await AsyncStorage.getItem('faceScanDone');
    const hasFaceScan = faceScanDone === 'true';
    if (!hasFaceScan) return 'faceScan';
    
    // All steps completed
    return null;
  } catch (error) {
    console.error('[kycValidation] Error getting incomplete step:', error);
    return 'dob'; // Default to first step on error
  }
}

/**
 * Navigate to the next KYC step in sequence
 * Steps: 1. Verify ID → 2. Personal Details → 3. Select Category → 4. Upload Avatar → 5. Face Scan → KYC Status (Completed)
 */
export async function navigateToNextKycStep(currentStep: string): Promise<void> {
  try {
    const userResult = await getCurrentUser();
    const user = userResult.success ? userResult.data : null;
    const role = await AsyncStorage.getItem('userRole') || 'participant';
    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';
    const email = user?.email || '';
    
    // Navigate to next step in sequence based on current step
    switch (currentStep) {
      case 'verifyId':
        // Step 1: Verify ID → Next: Personal Details (Step 2)
        const verifyIdQuery = [
          `role=${encodeURIComponent(role)}`,
          `firstName=${encodeURIComponent(firstName)}`,
          `lastName=${encodeURIComponent(lastName)}`,
          `email=${encodeURIComponent(email)}`,
          `fromKycFlow=true`, // Flag for KYC sequential flow
        ].join('&');
        router.push(`/onboarding/verify-id?${verifyIdQuery}` as any);
        break;
        
      case 'personalDetails':
        // Step 2: Personal Details → Next: Select Category (Step 3)
        const personalDetailsQuery = [
          `role=${encodeURIComponent(role)}`,
          `firstName=${encodeURIComponent(firstName)}`,
          `lastName=${encodeURIComponent(lastName)}`,
          `email=${encodeURIComponent(email)}`,
          `fromKycFlow=true`, // Flag for KYC sequential flow
        ].join('&');
        router.push(`/onboarding/personal-details?${personalDetailsQuery}` as any);
        break;
        
      case 'selectCategory':
        // Step 3: Select Category → Next: Upload Avatar (Step 4)
        const selectCategoryQuery = [
          `role=${encodeURIComponent(role)}`,
          `firstName=${encodeURIComponent(firstName)}`,
          `lastName=${encodeURIComponent(lastName)}`,
          `email=${encodeURIComponent(email)}`,
          `fromKycFlow=true`, // Flag for KYC sequential flow
        ].join('&');
        router.push(`/onboarding/select-category?${selectCategoryQuery}` as any);
        break;
        
      case 'uploadAvatar':
        // Step 4: Upload Avatar → Next: Face Scan (Step 5)
        const uploadAvatarQuery = [
          `role=${encodeURIComponent(role)}`,
          `firstName=${encodeURIComponent(firstName)}`,
          `lastName=${encodeURIComponent(lastName)}`,
          `email=${encodeURIComponent(email)}`,
          `fromKycFlow=true`, // Flag for KYC sequential flow
        ].join('&');
        router.push(`/onboarding/upload-avatar?${uploadAvatarQuery}` as any);
        break;
        
      case 'faceScan':
        // Step 5: Face Scan → Next: KYC Status (Completed)
        const faceScanQuery = [
          `role=${encodeURIComponent(role)}`,
          `firstName=${encodeURIComponent(firstName)}`,
          `lastName=${encodeURIComponent(lastName)}`,
          `email=${encodeURIComponent(email)}`,
          `fromKycFlow=true`, // Flag for KYC sequential flow
        ].join('&');
        router.push(`/onboarding/face-scan?${faceScanQuery}` as any);
        break;
        
      case 'kycCompleted':
        // All steps done → Mark as completed and go to KYC Status Page
        await AsyncStorage.removeItem('kycFlowActive');
        
        // Auto-verify KYC if all steps are completed
        try {
          const allStepsCompleted = await areAllKycStepsCompleted();
          if (allStepsCompleted) {
            await autoVerifyKycIfComplete();
            if (__DEV__) {
              console.log('[kycValidation] KYC flow completed, status should be "completed"');
            }
          }
        } catch (error) {
          console.log("Could not auto-verify KYC:", error);
        }
        
        // Small delay to ensure backend has processed the update
        setTimeout(() => {
          router.replace('/(main)/settings/kyc-status' as any);
        }, 500);
        break;
        
      default:
        // Default: return to KYC status page
        router.replace('/(main)/settings/kyc-status' as any);
    }
  } catch (error) {
    console.error('[kycValidation] Error navigating to next KYC step:', error);
    router.replace('/(main)/settings/kyc-status' as any);
  }
}

/**
 * Navigate to the appropriate KYC step based on completion status
 * If pending → ALWAYS starts from step 1 (Verify ID) regardless of what's already completed
 * If completed → doesn't navigate
 */
export async function navigateToKycStep(): Promise<boolean> {
  try {
    // Check if KYC is already completed
    const isCompleted = await isKycCompleted();
    
    if (isCompleted) {
      if (__DEV__) {
        console.log('[kycValidation] KYC already completed, no navigation needed');
      }
      return false; // Don't navigate if completed
    }
    
    // Set flag to indicate we're starting KYC flow
    await AsyncStorage.setItem('kycFlowActive', 'true');
    
    // ALWAYS start from step 1 (Verify ID) for sequential flow
    // User will go through: Step 1 (Verify ID) → Step 2 (Personal Details) → Step 3 (Select Category) → Step 4 (Upload Avatar) → Step 5 (Face Scan) → KYC Status (Completed)
    if (__DEV__) {
      console.log('[kycValidation] Starting KYC flow from Step 1 (Verify ID)');
    }
    await navigateToNextKycStep('verifyId');
    
    return true;
  } catch (error) {
    console.error('[kycValidation] Error navigating to KYC step:', error);
    router.replace('/(main)/settings/kyc-status' as any);
    return true;
  }
}

/**
 * Validate KYC before allowing competition join
 * Shows alert and redirects to KYC screen if not completed
 * Returns true if KYC is valid, false otherwise
 */
export async function validateKycBeforeCompetition(): Promise<boolean> {
  const isCompleted = await isKycCompleted();
  
  if (!isCompleted) {
    Alert.alert(
      'KYC Verification Required',
      'Please complete your KYC verification to participate in competitions.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Complete KYC',
          onPress: async () => {
            // Navigate to the appropriate incomplete step
            await navigateToKycStep();
          },
        },
      ]
    );
    return false;
  }
  
  return true;
}


