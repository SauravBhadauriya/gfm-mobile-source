import React, { useState, useEffect } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { STICKERS } from '../../utils/stickerLoader';

interface StickerButtonProps {
  onPress?: () => void;
  onStickerSelect?: (stickerUri: string | number) => void;
}

/**
 * Sticker button component with sticker picker modal
 */
const StickerButton: React.FC<StickerButtonProps> = ({ onPress, onStickerSelect }) => {
  const [visible, setVisible] = useState(false);
  const [stickers, setStickers] = useState<string[]>([]);

  useEffect(() => {
    // Load stickers when component mounts
    setStickers(STICKERS);
  }, []);

  const handleStickerPress = (sticker: string | number) => {
    onStickerSelect?.(sticker);
    setVisible(false);
    onPress?.();
  };

  const screenWidth = Dimensions.get('window').width;
  const panelPadding = 40;
  const itemSpacing = 12;
  const columnsPerView = 4.5;
  const rows = 3;
  
  const availableWidth = screenWidth - panelPadding;
  const itemWidth = (availableWidth - (columnsPerView * itemSpacing)) / columnsPerView;
  const totalColumns = Math.ceil(stickers.length / rows);
  const totalWidth = (totalColumns * itemWidth) + ((totalColumns + 1) * itemSpacing);

  // Organize stickers into columns
  const columns: (string | number)[][] = [];
  for (let col = 0; col < totalColumns; col++) {
    const columnStickers: (string | number)[] = [];
    for (let row = 0; row < rows; row++) {
      const index = col * rows + row;
      if (index < stickers.length) {
        columnStickers.push(stickers[index]);
      }
    }
    columns.push(columnStickers);
  }

  return (
    <>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setVisible(true)} 
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text style={styles.label}>Sticker</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.panel}>
            <Text style={styles.title}>Choose Sticker</Text>

            {stickers.length > 0 ? (
              <View style={styles.scrollContainer}>
                <ScrollView 
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  pagingEnabled={false}
                  decelerationRate="fast"
                  contentContainerStyle={[
                    styles.stickersContainer,
                    { width: totalWidth }
                  ]}
                >
                  {columns.map((columnStickers, colIndex) => (
                    <View 
                      key={colIndex} 
                      style={[
                        styles.column,
                        { 
                          width: itemWidth,
                          marginRight: colIndex < totalColumns - 1 ? itemSpacing : 0,
                        }
                      ]}
                    >
                      {columnStickers.map((sticker, rowIndex) => (
                        <TouchableOpacity
                          key={`${colIndex}-${rowIndex}`}
                          onPress={() => handleStickerPress(sticker)}
                          style={[
                            styles.item,
                            { marginBottom: rowIndex < rows - 1 ? 12 : 0 },
                          ]}
                        >
                          <Image
                            source={typeof sticker === 'string' ? { uri: sticker } : sticker}
                            style={[styles.sticker, { width: itemWidth - 8, height: itemWidth - 8 }]}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No stickers found.{'\n'}
                  Please add stickers to src/assets/stickers folder
                </Text>
              </View>
            )}

            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  scrollContainer: {
    height: 300,
  },
  stickersContainer: {
    paddingVertical: 8,
    flexDirection: 'row',
    paddingLeft: 4,
  },
  column: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sticker: {
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
  },
  close: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
});

export default StickerButton;
