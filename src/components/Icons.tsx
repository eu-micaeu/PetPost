import React from 'react';
import type { ColorValue } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';

type IconProps = {
  active: boolean;
  color: ColorValue;
  size?: number;
};

export function HomeTabIcon({ active, color, size = 26 }: IconProps) {
  if (active) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2.7L2.5 10.8C2.18 11.07 2 11.47 2 11.89V20C2 21.1 2.9 22 4 22H9C9.55 22 10 21.55 10 21V15C10 14.45 10.45 14 11 14H13C13.55 14 14 14.45 14 15V21C14 21.55 14.45 22 15 22H20C21.1 22 22 21.1 22 20V11.89C22 11.47 21.82 11.07 21.5 10.8L12 2.7Z"
          fill={color}
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3.2L21 10.5V20C21 20.55 20.55 21 20 21H15V14.5H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function FriendsTabIcon({ active, color, size = 26 }: IconProps) {
  if (active) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="9" cy="8" r="4" fill={color} />
        <Path
          d="M2 19C2 15.69 5.13 13 9 13C12.87 13 16 15.69 16 19C16 19.55 15.55 20 15 20H3C2.45 20 2 19.55 2 19Z"
          fill={color}
        />
        <Circle cx="17.5" cy="8" r="3" fill={color} opacity={0.75} />
        <Path
          d="M17.5 13C16.88 13 16.29 13.08 15.74 13.23C16.83 14.53 17.5 16.32 17.5 18.27V20H21C21.55 20 22 19.55 22 19C22 16.24 19.99 13.9 17.5 13Z"
          fill={color}
          opacity={0.75}
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="3.5" stroke={color} strokeWidth={1.8} />
      <Path
        d="M2.5 19.5C2.5 16.5 5.4 14 9 14C12.6 14 15.5 16.5 15.5 19.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M15 5.5C16.2 6.1 17 7.4 17 9C17 10.6 16.2 11.9 15 12.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M18.5 18.5C20 18 21.5 16.8 21.5 15C21.5 13.6 20.3 12.4 18.5 12.1"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function NotificationsTabIcon({ active, color, size = 26 }: IconProps) {
  if (active) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2C8.69 2 6 4.69 6 8V13.29L4.29 15C3.41 15.89 4.04 17.41 5.29 17.41H18.71C19.96 17.41 20.59 15.89 19.71 15L18 13.29V8C18 4.69 15.31 2 12 2Z"
          fill={color}
        />
        <Path
          d="M10 19C10 20.1 10.9 21 12 21C13.1 21 14 20.1 14 19H10Z"
          fill={color}
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8C18 4.69 15.31 2 12 2C8.69 2 6 4.69 6 8C6 14.5 3.5 16.5 3.5 16.5H20.5C20.5 16.5 18 14.5 18 8Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 20C13.55 20.3 13.3 20.55 13 20.73C12.7 20.9 12.35 21 12 21C11.65 21 11.3 20.9 11 20.73C10.7 20.55 10.45 20.3 10.27 20"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function UserIcon({ color = '#F0AEC9', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="12"
        cy="7"
        r="4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function UserTabIcon({ active, color, size = 26 }: IconProps) {
  if (active) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="7.5" r="4.5" fill={color} />
        <Path
          d="M4 20C4 16.13 7.58 13 12 13C16.42 13 20 16.13 20 20C20 20.55 19.55 21 19 21H5C4.45 21 4 20.55 4 20Z"
          fill={color}
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7.5" r="4" stroke={color} strokeWidth={1.8} />
      <Path
        d="M4.5 20.5C4.5 16.9 7.9 14 12 14C16.1 14 19.5 16.9 19.5 20.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function GearIcon({ color = '#C78EA8', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TrashIcon({ color = '#EF5350', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CameraIcon({ color = '#C78EA8', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PawIcon({ color = '#C78EA8', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M5.2 7.5C6.1 7.5 6.8 8.4 6.8 9.5C6.8 10.6 6.1 11.5 5.2 11.5C4.3 11.5 3.6 10.6 3.6 9.5C3.6 8.4 4.3 7.5 5.2 7.5Z" />
      <Path d="M9.2 3.5C10.2 3.5 11 4.5 11 5.8C11 7.1 10.2 8.1 9.2 8.1C8.2 8.1 7.4 7.1 7.4 5.8C7.4 4.5 8.2 3.5 9.2 3.5Z" />
      <Path d="M14.8 3.5C15.8 3.5 16.6 4.5 16.6 5.8C16.6 7.1 15.8 8.1 14.8 8.1C13.8 8.1 13 7.1 13 5.8C13 4.5 13.8 3.5 14.8 3.5Z" />
      <Path d="M18.8 7.5C19.7 7.5 20.4 8.4 20.4 9.5C20.4 10.6 19.7 11.5 18.8 11.5C17.9 11.5 17.2 10.6 17.2 9.5C17.2 8.4 17.9 7.5 18.8 7.5Z" />
      <Path d="M12 11C8.6 11 6.5 13.2 6.5 15.8C6.5 18.2 8.8 20.5 12 20.5C15.2 20.5 17.5 18.2 17.5 15.8C17.5 13.2 15.4 11 12 11Z" />
    </Svg>
  );
}

export function CakeIcon({ color = '#C78EA8', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 21h20" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 8v3M12 8v3M17 8v3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 4h.01M12 4h.01M17 4h.01" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusIcon({ color = '#FFF9FB', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronLeftIcon({ color = '#C78EA8', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ color = '#C78EA8', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronDownIcon({ color = '#C78EA8', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronUpIcon({ color = '#C78EA8', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DogIcon({ color = '#C78EA8', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 5.17C10 3.78 8.42 2.68 6.5 3c-2.82.47-3.5 4-3.5 6 1 0 3.5-.4 4.5-1.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 5.17C14 3.78 15.58 2.68 17.5 3c2.82.47 3.5 4 3.5 6-1 0-3.5-.4-4.5-1.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 9a6 6 0 0 0 12 0c0-3.31-2.69-5-6-5s-6 1.69-6 5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 13a2 2 0 0 0 4 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="9" cy="9.5" r="1" fill={color} />
      <Circle cx="15" cy="9.5" r="1" fill={color} />
    </Svg>
  );
}

export function CatIcon({ color = '#C78EA8', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5c-4 0-7 2.5-7 7 0 4 3 7 7 7s7-3 7-7c0-4.5-3-7-7-7z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M6 7L4 3l4 1.5M18 7l2-4-4 1.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="11.5" r="1" fill={color} />
      <Circle cx="15" cy="11.5" r="1" fill={color} />
      <Path d="M11 14.5l1 .5 1-.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 12h4M3 14h4M21 12h-4M21 14h-4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function BirdIcon({ color = '#C78EA8', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 7a4 4 0 0 1-4 4H7l-4 4 2-5-2-1c0-4 3.5-6 7-6a5 5 0 0 1 6 4z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M16 6l5 2-5 1" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="13" cy="6" r="1" fill={color} />
      <Path d="M8 15v5M11 15v5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function RabbitIcon({ color = '#C78EA8', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 11c-3 0-5 2.5-5 6 0 3 2.5 4 5 4s5-1 5-4c0-3.5-2-6-5-6z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 11V3a2 2 0 0 1 4 0v8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11 11V4a2 2 0 0 1 4 0v7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="7.5" cy="15" r="1" fill={color} />
      <Circle cx="10.5" cy="15" r="1" fill={color} />
      <Path d="M9 17.5v.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function SpeciesIcon({ species, color = '#C78EA8', size = 22 }: { species: string; color?: string; size?: number }) {
  const s = (species || '').toLowerCase();
  if (s.includes('cachorro') || s.includes('cão') || s.includes('cao')) {
    return <DogIcon color={color} size={size} />;
  }
  if (s.includes('gato')) {
    return <CatIcon color={color} size={size} />;
  }
  if (s.includes('ave') || s.includes('pássaro') || s.includes('passaro')) {
    return <BirdIcon color={color} size={size} />;
  }
  if (s.includes('coelho')) {
    return <RabbitIcon color={color} size={size} />;
  }
  return <PawIcon color={color} size={size} />;
}

export function HeartOutlineIcon({ color = '#8E8698', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HeartFilledIcon({ color = '#C78EA8', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      />
    </Svg>
  );
}

export function GalleryIcon({ color = '#C78EA8', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="8.5" cy="8.5" r="1.5" stroke={color} strokeWidth={2} />
      <Path
        d="M21 15l-5-5L5 21"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckCircleIcon({ color = '#4CAF50', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function AlertCircleIcon({ color = '#EF5350', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function InfoCircleIcon({ color = '#C78EA8', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function XIcon({ color = '#AAA1B0', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Logo do PetPost (logoPetPost.svg), com o traço ajustável. */
export function PetPostLogo({ color = '#C78EA8', size = 50, strokeWidth = 2 }: { color?: string; size?: number; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 50 50" fill="none">
      <Path
        d="M16.6667 29.1667V30.2083M33.3334 29.1667V30.2083M25 10.4167C26.3959 10.4167 27.8125 10.6042 29.1667 10.9583C32.875 6.79167 39.6459 5.04167 42.5417 6.25C45.4584 7.45833 41.6667 20.8333 41.6667 20.8333C42.8542 23.0625 43.75 25.5 43.75 28C43.75 37.2917 35.3542 43.75 25 43.75C14.6459 43.75 6.25004 37.5 6.25004 28C6.25004 25.3958 7.29171 23 8.33338 20.8333C8.33338 20.8333 4.39587 7.45833 7.29171 6.25C10.1875 5.04167 17.125 6.72917 20.8334 10.8958C22.2 10.5808 23.5976 10.4201 25 10.4167Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M23.4375 33.8542H26.5625L25 35.4167L23.4375 33.8542Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
