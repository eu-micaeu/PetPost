import React from 'react';
import { Circle, Path, Svg } from 'react-native-svg';

type IconProps = {
  active: boolean;
  color: string;
};

export function HomeTabIcon({ active, color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.25L12 3.5L21 10.25V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V10.25Z"
        stroke={color}
        strokeWidth={active ? 2.3 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'rgba(199, 142, 168, 0.16)' : 'none'}
      />
    </Svg>
  );
}

export function FriendsTabIcon({ active, color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 21V19C16 16.7909 14.2091 15 12 15H7C4.79086 15 3 16.7909 3 19V21"
        stroke={color}
        strokeWidth={active ? 2.3 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'rgba(199, 142, 168, 0.16)' : 'none'}
      />
      <Circle
        cx="9.5"
        cy="7.5"
        r="3.5"
        stroke={color}
        strokeWidth={active ? 2.3 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'rgba(199, 142, 168, 0.16)' : 'none'}
      />
      <Path
        d="M17 11C18.6569 11 20 9.65685 20 8C20 6.34315 18.6569 5 17 5"
        stroke={color}
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 21V19C20.9964 17.5878 20.0887 16.3411 18.75 15.85"
        stroke={color}
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function NotificationsTabIcon({ active, color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
        stroke={color}
        strokeWidth={active ? 2.3 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'rgba(199, 142, 168, 0.16)' : 'none'}
      />
      <Path
        d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
        stroke={color}
        strokeWidth={active ? 2.3 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PetsTabIcon({ active, color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M5.2 7.5C6.1 7.5 6.8 8.4 6.8 9.5C6.8 10.6 6.1 11.5 5.2 11.5C4.3 11.5 3.6 10.6 3.6 9.5C3.6 8.4 4.3 7.5 5.2 7.5Z" />
      <Path d="M9.2 3.5C10.2 3.5 11 4.5 11 5.8C11 7.1 10.2 8.1 9.2 8.1C8.2 8.1 7.4 7.1 7.4 5.8C7.4 4.5 8.2 3.5 9.2 3.5Z" />
      <Path d="M14.8 3.5C15.8 3.5 16.6 4.5 16.6 5.8C16.6 7.1 15.8 8.1 14.8 8.1C13.8 8.1 13 7.1 13 5.8C13 4.5 13.8 3.5 14.8 3.5Z" />
      <Path d="M18.8 7.5C19.7 7.5 20.4 8.4 20.4 9.5C20.4 10.6 19.7 11.5 18.8 11.5C17.9 11.5 17.2 10.6 17.2 9.5C17.2 8.4 17.9 7.5 18.8 7.5Z" />
      <Path d="M12 11C8.6 11 6.5 13.2 6.5 15.8C6.5 18.2 8.8 20.5 12 20.5C15.2 20.5 17.5 18.2 17.5 15.8C17.5 13.2 15.4 11 12 11Z" />
    </Svg>
  );
}
