import React, { useRef, useState } from 'react';
import { Dimensions, Modal, Text, TouchableOpacity, View } from 'react-native';
import { cameraStyles } from '../styles/cameraStyles';

export type SpeedMultiplier = 0.5 | 1 | 2 | 3;

interface SpeedSelectorProps {
  speed: SpeedMultiplier;
  onSpeedChange: (speed: SpeedMultiplier) => void;
  disabled?: boolean;
}

/**
 * Speed selector component for camera screen.
 * Shows a speed icon button that opens a modal popup with speed options.
 */
const SpeedSelector: React.FC<SpeedSelectorProps> = ({ speed, onSpeedChange, disabled = false }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({ 
    x: 0, 
    y: 0, 
    width: 0, 
    height: 0, 
    buttonY: 0, 
    buttonHeight: 0, 
    buttonCenterY: 0, 
    arrowTop: 0 
  });
  const [popupLayout, setPopupLayout] = useState({ width: 0, height: 0 });
  const buttonRef = useRef<View>(null);
  const popupRef = useRef<View>(null);

  const speedOptions: SpeedMultiplier[] = [0.5, 1, 2, 3];
  const speedLabels: Record<SpeedMultiplier, string> = {
    0.5: '0.5x',
    1: '1x',
    2: '2x',
    3: '3x',
  };

  const handleOpenModal = () => {
    if (disabled) return;
    if (buttonRef.current) {
      buttonRef.current.measure((x, y, width, height, pageX, pageY) => {
        const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
        
        // Responsive spacing based on screen size
        const spacing = screenWidth * 0.02; // 2% of screen width
        const estimatedPopupWidth = screenWidth * 0.18; // 18% of screen width (min 60px)
        let popupLeft = pageX + width + spacing;
        
        // Ensure popup doesn't go off-screen on the right
        const safeAreaMargin = screenHeight * 0.015; // 1.5% of screen height
        if (popupLeft + estimatedPopupWidth > screenWidth - safeAreaMargin) {
          popupLeft = screenWidth - estimatedPopupWidth - safeAreaMargin;
        }
        
        // Calculate button center Y position
        const buttonCenterY = pageY + height / 2;
        
        // Use estimated popup height (will be corrected on layout)
        // Rough estimate: ~35px per option including padding/margins
        const optionsCount = 4;
        const estimatedPopupHeight = optionsCount * (screenHeight * 0.045); // ~4.5% per option
        
        // Center the popup on the button (will be adjusted when actual dimensions are known)
        let popupTop = buttonCenterY - (estimatedPopupHeight / 2);
        
        // Ensure popup doesn't go off-screen
        const minTop = safeAreaMargin;
        const maxTop = screenHeight - estimatedPopupHeight - safeAreaMargin;
        popupTop = Math.max(minTop, Math.min(popupTop, maxTop));
        
        // Store initial layout - will update when popup is measured
        setButtonLayout({ 
          x: popupLeft,
          y: popupTop,
          buttonY: pageY,
          buttonHeight: height,
          buttonCenterY,
          width, 
          height,
          arrowTop: 0 // Will be calculated after popup measurement
        });
        setModalVisible(true);
      });
    }
  };

  const handleSelectSpeed = (selectedSpeed: SpeedMultiplier) => {
    onSpeedChange(selectedSpeed);
    setModalVisible(false);
  };

  const handlePopupLayout = () => {
    if (popupRef.current && buttonLayout.buttonCenterY) {
      popupRef.current.measure((x, y, width, height, pageX, pageY) => {
        const { height: screenHeight } = Dimensions.get('window');
        const actualPopupHeight = height;
        const buttonCenterY = buttonLayout.buttonCenterY;
        
        // Responsive safe area margin
        const safeAreaMargin = screenHeight * 0.015; // 1.5% of screen height
        
        // Recalculate popup position with actual height
        let popupTop = buttonCenterY - (actualPopupHeight / 2) - 30;
        const minTop = safeAreaMargin;
        const maxTop = screenHeight - actualPopupHeight - safeAreaMargin;
        popupTop = Math.max(minTop, Math.min(popupTop, maxTop));
        
        // Calculate arrow position to point at button center
        const arrowTopPosition = buttonCenterY - popupTop - 30;
        
        setButtonLayout(prev => ({
          ...prev,
          y: popupTop,
          arrowTop: arrowTopPosition
        }));
        setPopupLayout({ width, height: actualPopupHeight });
      });
    }
  };

  return (
    <>
      <View ref={buttonRef} collapsable={false}>
        <TouchableOpacity
          style={[cameraStyles.speedSelectorButton, disabled && cameraStyles.disabledIconButton]}
          onPress={handleOpenModal}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={[cameraStyles.speedSelectorText, disabled && cameraStyles.disabledIconText]}>
            {speedLabels[speed]}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={cameraStyles.speedModalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            ref={popupRef}
            onLayout={handlePopupLayout}
            style={[
              cameraStyles.speedModalContent,
              {
                left: buttonLayout.x,
                top: buttonLayout.y,
              },
            ]}
            pointerEvents="auto"
          >
            {/* Arrow pointing left - aligned to button center */}
            {buttonLayout.arrowTop > 0 && (
              <View style={[cameraStyles.speedModalArrow, { 
                top: buttonLayout.arrowTop - (cameraStyles.speedModalArrow.borderTopWidth || 7)
              }]} />
            )}
            {speedOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  cameraStyles.speedModalOption,
                  speed === option && cameraStyles.speedModalOptionActive,
                ]}
                onPress={() => handleSelectSpeed(option)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    cameraStyles.speedModalOptionText,
                    speed === option && cameraStyles.speedModalOptionTextActive,
                  ]}
                >
                  {speedLabels[option]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default SpeedSelector;
