import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getUserReels } from '../api/services/reelsService';
import type { Reel } from '../types/reels';

const { height } = Dimensions.get('window');

const ReelsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [reels, setReels] = useState<Reel[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getUserReels({ page: 1, limit: 10 });
      setReels(response.data.reels || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load reels');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Reel }) => {
    return (
      <View style={styles.reelItem}>
        <Text style={styles.title}>{item.user.username}</Text>
        <Text style={styles.caption}>{item.caption || 'No caption'}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.infoText}>Loading reels...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!reels.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.infoText}>No reels found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={reels}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToAlignment="start"
      decelerationRate="fast"
    />
  );
};

export default ReelsScreen;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  reelItem: {
    height,
    backgroundColor: '#000',
    justifyContent: 'flex-end',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
  },
});