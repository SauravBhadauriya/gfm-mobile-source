import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getUserKycStatus } from '../../../src/api/services/userService';
import type { KycStatus } from '../../../src/api/services/userService';
import { navigateToKycStep } from '../../../src/utils/kycValidation';

export default function KycStatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [kyc, setKyc] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchKycStatus();
  }, []);

  // Refresh status when screen comes into focus (e.g., after completing KYC flow)
  useFocusEffect(
    React.useCallback(() => {
      fetchKycStatus();
    }, [])
  );

  const fetchKycStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getUserKycStatus();
      
      if (result.success && result.data) {
        setKyc(result.data);
      } else {
        setError(result.message || 'Failed to fetch KYC status');
        // If no KYC found, set pending status
        setKyc({ status: 'pending' });
      }
    } catch (err: any) {
      console.error('Error fetching KYC status:', err);
      setError(err.message || 'Failed to load KYC status');
      setKyc({ status: 'pending' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchKycStatus();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return '#10B981'; // green
      case 'rejected':
        return '#EF4444'; // red
      case 'completed':
        return '#3B82F6'; // blue
      default:
        return '#F59E0B'; // yellow
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'completed':
        return 'Completed';
      default:
        return 'Pending';
    }
  };

  if (loading && !kyc) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>KYC Status</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EC9A15" />
          <Text style={styles.loadingText}>Loading KYC status...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KYC Status</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Badge */}
        <View style={styles.statusCard}>
          {kyc?.status === 'pending' || kyc?.status === undefined ? (
            <TouchableOpacity
              style={[styles.statusBadge, { backgroundColor: getStatusColor(kyc?.status) }]}
              onPress={async () => {
                // Navigate to the appropriate incomplete step
                await navigateToKycStep();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.statusText}>{getStatusText(kyc?.status)}</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(kyc?.status) }]}>
              <Text style={styles.statusText}>{getStatusText(kyc?.status)}</Text>
            </View>
          )}

          {kyc?.status === 'approved' && (
            <Text style={styles.successMessage}>
              Your KYC verification has been approved. You can now access all features.
            </Text>
          )}

          {kyc?.status === 'completed' && (
            <Text style={styles.successMessage}>
              Your KYC verification is completed. You can now access all features.
            </Text>
          )}

          {kyc?.status === 'rejected' && kyc.rejectionReason && (
            <View style={styles.rejectionContainer}>
              <Text style={styles.rejectionTitle}>Rejection Reason:</Text>
              <Text style={styles.rejectionReason}>{kyc.rejectionReason}</Text>
              <Text style={styles.rejectionNote}>
                Please submit your documents again with the required corrections.
              </Text>
            </View>
          )}

          {(kyc?.status === 'pending' || kyc?.status === undefined) && (
            <View>
              <Text style={styles.pendingMessage}>
                Tap the "Pending" button above to complete your verification steps.
              </Text>
              <Text style={styles.pendingSubMessage}>
                Complete all required steps to verify your account automatically.
              </Text>
            </View>
          )}
        </View>

        {/* Submission Date */}
        {kyc?.submittedAt && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Submitted On</Text>
            <Text style={styles.infoValue}>
              {new Date(kyc.submittedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        )}

        {/* Review Date */}
        {kyc?.reviewedAt && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Reviewed On</Text>
            <Text style={styles.infoValue}>
              {new Date(kyc.reviewedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        )}

        {/* Documents */}
        {kyc?.documents && kyc.documents.length > 0 && (
          <View style={styles.documentsContainer}>
            <Text style={styles.sectionTitle}>Submitted Documents</Text>
            {kyc.documents.map((doc: any, index: number) => (
              <View key={index} style={styles.documentCard}>
                <Text style={styles.documentType}>
                  {doc.documentType || 'Document'} {doc.documentNumber ? `- ${doc.documentNumber}` : ''}
                </Text>
                <View style={styles.documentImages}>
                  {doc.frontImage && (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: doc.frontImage }}
                        style={styles.documentImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.imageLabel}>Front</Text>
                    </View>
                  )}
                  {doc.backImage && (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: doc.backImage }}
                        style={styles.documentImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.imageLabel}>Back</Text>
                    </View>
                  )}
                  {doc.selfieImage && (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: doc.selfieImage }}
                        style={styles.documentImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.imageLabel}>Selfie</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {error && !kyc && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText} onPress={fetchKycStatus}>
              Tap to retry
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  statusCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  successMessage: {
    fontSize: 14,
    color: '#10B981',
    textAlign: 'center',
    marginTop: 8,
  },
  rejectionContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    width: '100%',
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  rejectionReason: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
    lineHeight: 20,
  },
  rejectionNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  pendingMessage: {
    fontSize: 14,
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  pendingSubMessage: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  documentsContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  documentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  documentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  documentImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    flex: 1,
    minWidth: '45%',
  },
  documentImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
  },
  imageLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryText: {
    fontSize: 14,
    color: '#EC9A15',
    textDecorationLine: 'underline',
  },
});


