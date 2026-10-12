import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Path, Svg } from 'react-native-svg';
import { router, type Tabs } from 'expo-router';
import * as Haptics from 'expo-haptics';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];
type TabOptions = TabBarProps['descriptors'][string]['options'];

export const TAB_BAR_HEIGHT = 64;
export const PUBLISH_ROUTE = '_publish_button';

const ACTIVE_COLOR = '#F7C1D7';
const INACTIVE_COLOR = '#827989';
const PILL_WIDTH = 54;
const PILL_HEIGHT = 42;
const ROW_PADDING = 6;
const useNativeDriver = Platform.OS !== 'web';

function getTabBarBottom(insetBottom: number) {
  return Math.max(insetBottom + 8, 18);
}

/** Espaço que o conteúdo rolável precisa reservar para não ficar atrás da barra flutuante. */
export function useTabBarSpace(extra = 24) {
  const insets = useSafeAreaInsets();
  return getTabBarBottom(insets.bottom) + TAB_BAR_HEIGHT + extra;
}

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // No iOS o teclado já cobre a barra; no Android ela "subiria" junto com o teclado.
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}

function lightHaptic(style?: Haptics.ImpactFeedbackStyle) {
  try {
    if (style) Haptics.impactAsync(style);
    else Haptics.selectionAsync();
  } catch {
    // Silencioso
  }
}

export function TabBar({ state, descriptors, navigation, insets }: TabBarProps) {
  const [width, setWidth] = useState(0);
  const keyboardVisible = useKeyboardVisible();
  const translateX = useState(() => new Animated.Value(0))[0];
  const hasPositioned = useRef(false);

  const slotWidth = (width - ROW_PADDING * 2) / state.routes.length;

  useEffect(() => {
    if (!slotWidth) return;
    const toValue = ROW_PADDING + state.index * slotWidth + (slotWidth - PILL_WIDTH) / 2;
    if (!hasPositioned.current) {
      translateX.setValue(toValue);
      hasPositioned.current = true;
      return;
    }
    Animated.spring(translateX, {
      toValue,
      damping: 17,
      stiffness: 210,
      mass: 0.9,
      useNativeDriver,
    }).start();
  }, [state.index, slotWidth, translateX]);

  if (keyboardVisible) return null;

  function handleLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  return (
    <View
      style={[styles.wrapper, { bottom: getTabBarBottom(insets.bottom) }]}
      pointerEvents="box-none"
    >
      <View style={styles.island}>
        <BlurView intensity={85} tint="dark" style={[StyleSheet.absoluteFill, styles.blur]} />
        <View style={styles.topHighlight} pointerEvents="none" />

        <View style={styles.row} onLayout={handleLayout} accessibilityRole="tablist">
          {width > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[styles.indicator, { transform: [{ translateX }] }]}
            >
              <View style={styles.indicatorGlow} />
            </Animated.View>
          )}

          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];

            if (route.name === PUBLISH_ROUTE) {
              return <PublishButton key={route.key} label={options.title || 'Publicar'} />;
            }

            const focused = state.index === index;

            return (
              <TabItem
                key={route.key}
                focused={focused}
                options={options}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  lightHaptic();
                  // Tocar na aba ativa dispara o scroll-to-top (useScrollToTop) nas telas.
                  if (!focused && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                }}
                onLongPress={() => {
                  navigation.emit({ type: 'tabLongPress', target: route.key });
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

type TabItemProps = {
  focused: boolean;
  options: TabOptions;
  onPress: () => void;
  onLongPress: () => void;
};

function TabItem({ focused, options, onPress, onLongPress }: TabItemProps) {
  const focus = useState(() => new Animated.Value(focused ? 1 : 0))[0];
  const press = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    Animated.spring(focus, {
      toValue: focused ? 1 : 0,
      damping: 12,
      stiffness: 240,
      useNativeDriver,
    }).start();
  }, [focused, focus]);

  function animatePress(toValue: number) {
    Animated.spring(press, { toValue, damping: 15, stiffness: 400, useNativeDriver }).start();
  }

  const scale = Animated.multiply(
    focus.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }),
    press,
  );
  const translateY = focus.interpolate({ inputRange: [0, 1], outputRange: [0, -1] });

  const icon = options.tabBarIcon?.({
    focused,
    color: focused ? ACTIVE_COLOR : INACTIVE_COLOR,
    size: 26,
  });

  return (
    <Pressable
      style={styles.slot}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => animatePress(0.86)}
      onPressOut={() => animatePress(1)}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title}
      testID={options.tabBarButtonTestID}
      hitSlop={4}
    >
      <Animated.View style={[styles.iconWrap, { transform: [{ translateY }, { scale }] }]}>
        {icon}
        <Badge value={options.tabBarBadge} />
      </Animated.View>
    </Pressable>
  );
}

function Badge({ value }: { value: TabOptions['tabBarBadge'] }) {
  const pop = useState(() => new Animated.Value(value != null ? 1 : 0))[0];

  useEffect(() => {
    if (value == null) {
      pop.setValue(0);
      return;
    }
    pop.setValue(0.4);
    Animated.spring(pop, { toValue: 1, damping: 8, stiffness: 300, useNativeDriver }).start();
  }, [value, pop]);

  if (value == null) return null;

  return (
    <Animated.View style={[styles.badge, { transform: [{ scale: pop }] }]}>
      <Text style={styles.badgeText}>{value}</Text>
    </Animated.View>
  );
}

function PublishButton({ label }: { label: string }) {
  const press = useState(() => new Animated.Value(1))[0];

  function animatePress(toValue: number) {
    Animated.spring(press, { toValue, damping: 12, stiffness: 380, useNativeDriver }).start();
  }

  return (
    <Pressable
      style={styles.slot}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => animatePress(0.9)}
      onPressOut={() => animatePress(1)}
      onPress={() => {
        lightHaptic(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/publish');
      }}
      hitSlop={8}
    >
      <Animated.View style={[styles.publishFab, { transform: [{ scale: press }] }]}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 5V19M5 12H19"
            stroke="#FFF9FB"
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // A sombra fica no wrapper (sem overflow: hidden), senão o iOS a corta.
  wrapper: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    backgroundColor: Platform.OS === 'android' ? '#16131C' : 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 16,
  },
  island: {
    flex: 1,
    borderRadius: TAB_BAR_HEIGHT / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  blur: {
    // Sem blur nativo no Android (blurMethod 'none'), então a camada fica mais opaca.
    backgroundColor: Platform.OS === 'android' ? 'rgba(22, 19, 28, 0.96)' : 'rgba(20, 17, 26, 0.72)',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ROW_PADDING,
  },
  slot: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: (TAB_BAR_HEIGHT - 2 - PILL_HEIGHT) / 2,
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    backgroundColor: 'rgba(240, 174, 201, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(240, 174, 201, 0.24)',
    alignItems: 'center',
  },
  indicatorGlow: {
    position: 'absolute',
    bottom: -1,
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: ACTIVE_COLOR,
    opacity: 0.9,
    shadowColor: ACTIVE_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -9,
    backgroundColor: '#E25B7B',
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#181522',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },
  publishFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C77997',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C77997',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
});
