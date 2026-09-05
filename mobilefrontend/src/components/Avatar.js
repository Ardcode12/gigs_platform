import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, FONT_WEIGHT } from '../theme';
import { initialsOf } from '../utils/format';

/**
 * Initials avatar, with a photo when one exists.
 *
 * Replaces the same block hand-rolled in Home, NewJobRequest, CurrentJob, Chat
 * and Profile.
 */
const Avatar = ({
  name = '',
  uri,
  size = 48,
  backgroundColor = COLORS.primaryLight,
  color = COLORS.primary,
  online,
  style,
}) => {
  const radius = size / 2;

  return (
    <View style={[{ width: size, height: size }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: radius }}
        />
      ) : (
        <View
          style={[
            styles.initials,
            { width: size, height: size, borderRadius: radius, backgroundColor },
          ]}
        >
          <Text style={[styles.text, { color, fontSize: size * 0.38 }]}>
            {initialsOf(name) || '?'}
          </Text>
        </View>
      )}

      {online != null && (
        <View
          style={[
            styles.dot,
            {
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: size * 0.14,
              backgroundColor: online ? COLORS.online : COLORS.offline,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  initials: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: FONT_WEIGHT.bold,
  },
  dot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});

export default Avatar;
