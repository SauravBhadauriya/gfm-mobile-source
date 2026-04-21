import Animated from 'react-native-reanimated';

export function HelloWave() {
  return (
    <Animated.Text
      style={{
        fontSize: 28,
        lineHeight: 32,
        marginTop: -6,
        animationName: {
          from: { rotate: '0deg' },
          to: { rotate: '14deg' },
        },
        animationDuration: '1s',
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
      }}>
      👋
    </Animated.Text>
  );
}

