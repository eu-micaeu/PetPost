import React, { useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { HeartFilledIcon, HeartOutlineIcon } from './Icons';
import { timeAgo } from '../utils/timeAgo';
import type { PostRecord } from '../types';

type FeedPostCardProps = {
  post: PostRecord;
  isLiked: boolean;
  likesCount: number;
  onToggleLike: (postId: string) => void;
};

export function FeedPostCard({ post, isLiked, likesCount, onToggleLike }: FeedPostCardProps) {
  const lastTapRef = useRef<number>(0);
  const [heartScale] = useState(() => new Animated.Value(0));
  const [heartOpacity] = useState(() => new Animated.Value(0));

  function triggerHeartAnimation() {
    heartScale.setValue(0.5);
    heartOpacity.setValue(1);

    Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1.25,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(350),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }

  function handleImagePress() {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Duplo clique detectado!
      triggerHeartAnimation();
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // Silencioso
      }
      if (!isLiked) {
        onToggleLike(post.id);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }

  function handleLikePress() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silencioso
    }
    if (!isLiked) {
      triggerHeartAnimation();
    }
    onToggleLike(post.id);
  }

  const initial = (post.nickname?.replace(/^@/, '')[0] || 'P').toUpperCase();

  return (
    <View style={styles.card}>
      {/* Cabeçalho do Card */}
      <View style={styles.cardHeader}>
        <View style={styles.authorGroup}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <View style={styles.authorMeta}>
            <Text style={styles.authorNickname}>@{post.nickname ?? 'petpost'}</Text>
            <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
          </View>
        </View>
      </View>

      {/* Imagem com suporte a duplo toque */}
      <Pressable onPress={handleImagePress} style={styles.imageContainer}>
        <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />

        {/* Animação de coração no duplo toque */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.floatingHeartContainer,
            {
              opacity: heartOpacity,
              transform: [{ scale: heartScale }],
            },
          ]}
        >
          <HeartFilledIcon color="#FF5277" size={84} />
        </Animated.View>
      </Pressable>

      {/* Barra de Ações e Informações */}
      <View style={styles.cardFooter}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
          onPress={handleLikePress}
          hitSlop={8}
        >
          {isLiked ? (
            <HeartFilledIcon color="#FF5277" size={24} />
          ) : (
            <HeartOutlineIcon color="#EAE5ED" size={24} />
          )}
          <Text style={[styles.likesText, isLiked && styles.likesTextActive]}>
            {likesCount > 0
              ? `${likesCount} ${likesCount === 1 ? 'curtida' : 'curtidas'}`
              : 'Curtir'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1B1820',
    borderWidth: 1,
    borderColor: '#37303C',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2A2433',
    borderWidth: 1.5,
    borderColor: '#5A4A62',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFF9FB',
    fontSize: 15,
    fontWeight: '800',
  },
  authorMeta: {
    gap: 2,
  },
  authorNickname: {
    color: '#FFF9FB',
    fontSize: 14,
    fontWeight: '800',
  },
  postTime: {
    color: '#AAA1B0',
    fontSize: 11,
    fontWeight: '500',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#131117',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  floatingHeartContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  cardFooter: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#282430',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  likesText: {
    color: '#AAA1B0',
    fontSize: 13,
    fontWeight: '700',
  },
  likesTextActive: {
    color: '#FFF9FB',
  },
});
