import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AlertCircleIcon, CheckCircleIcon, InfoCircleIcon, XIcon } from '../components/Icons';

type ToastType = 'success' | 'info' | 'error';

type ToastContextType = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType>({
  show: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [translateY] = useState(() => new Animated.Value(-100));
  const [opacity] = useState(() => new Animated.Value(0));
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [opacity, translateY]);

  const show = useCallback(
    (message: string, type: ToastType = 'success') => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setToast({ message, type });

      // Feedback tátil de acordo com o tipo
      try {
        if (type === 'success') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (type === 'error') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch {
        // Silencioso se haptics falhar
      }

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      timeoutRef.current = setTimeout(() => {
        hide();
      }, 3000);
    },
    [hide, opacity, translateY],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.toastContainer,
            {
              top: Math.max(insets.top + 8, 16),
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.toastPill,
              styles[toast.type],
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={hide}
          >
            <View style={styles.iconWrapper}>
              {toast.type === 'success' && <CheckCircleIcon color="#69F0AE" size={20} />}
              {toast.type === 'error' && <AlertCircleIcon color="#FF5252" size={20} />}
              {toast.type === 'info' && <InfoCircleIcon color="#C78EA8" size={20} />}
            </View>
            <Text style={styles.toastMessage} numberOfLines={2}>
              {toast.message}
            </Text>
            <Pressable onPress={hide} hitSlop={10} style={styles.closeButton}>
              <XIcon color="#B8AABD" size={16} />
            </Pressable>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B24',
    borderWidth: 1,
    borderColor: '#3D3545',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    maxWidth: 420,
    width: '100%',
  },
  success: {
    borderColor: '#2E4C3B',
  },
  error: {
    borderColor: '#54282F',
  },
  info: {
    borderColor: '#4A3745',
  },
  iconWrapper: {
    marginRight: 10,
  },
  toastMessage: {
    flex: 1,
    color: '#FFF9FB',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  closeButton: {
    marginLeft: 8,
    padding: 2,
  },
});
