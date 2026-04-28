import Link from 'next/link'

const SIZE_MAP = { xs: 24, sm: 32, md: 44, lg: 56, xl: 80 }

const THEMES = {
  light: {
    iconBg: '#5D1A8B',
    iconPrimary: '#ffffff',
    iconSecondary: '#D4537E',
    textSister: '#5D1A8B',
    textRoam: '#D4537E',
    tagline: '#888780',
  },
  dark: {
    iconBg: '#5D1A8B',
    iconPrimary: '#ffffff',
    iconSecondary: '#D4537E',
    textSister: '#ffffff',
    textRoam: '#F4C0D1',
    tagline: 'rgba(255,255,255,0.4)',
  },
  purple: {
    iconBg: 'rgba(255,255,255,0.12)',
    iconBgStroke: 'rgba(255,255,255,0.15)',
    iconPrimary: '#ffffff',
    iconSecondary: '#F4C0D1',
    textSister: '#ffffff',
    textRoam: '#F4C0D1',
    tagline: 'rgba(255,255,255,0.45)',
  },
  auto: {
    iconBg: '#5D1A8B',
    iconPrimary: '#ffffff',
    iconSecondary: '#D4537E',
    textSister: '#5D1A8B',
    textRoam: '#D4537E',
    tagline: '#888780',
  },
}

function resolveHeight(size) {
  if (typeof size === 'number') return size
  return SIZE_MAP[size] ?? SIZE_MAP.md
}

function IconMark({ colors, cx, cy, r, scale = 1 }) {
  const strokeProps =
    colors.iconBgStroke
      ? { stroke: colors.iconBgStroke, strokeWidth: 1 / scale }
      : {}

  const hx = cx - 8 * scale
  const hy = cy - 10 * scale
  const hr = 10 * scale
  const bodyR = 17 * scale
  const tx = cx + 13 * scale
  const ty = cy - 9 * scale
  const tr = 7 * scale

  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={colors.iconBg} {...strokeProps} />
      <circle cx={hx} cy={hy} r={hr} fill={colors.iconPrimary} opacity="0.97" />
      <path
        d={`M${cx - 25 * scale} ${cy + 18 * scale}c0-${bodyR} ${bodyR - 0.611 * scale}-${bodyR} ${bodyR}-${bodyR}s${bodyR} ${bodyR - 0.611 * scale} ${bodyR} ${bodyR}`}
        stroke={colors.iconPrimary}
        strokeWidth={3.2 * scale}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={tx} cy={ty} r={tr} fill={colors.iconSecondary} opacity="0.92" />
      <path
        d={`M${tx + 2.5 * scale} ${cy + 15 * scale} Q${cx + 25 * scale} ${cy + 1 * scale} ${cx + 26.5 * scale} ${cy + 10 * scale}`}
        stroke={colors.iconSecondary}
        strokeWidth={2.8 * scale}
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    </>
  )
}

function FullVariant({ colors, height, size }) {
  const scale = height / 80
  const width = 320 * scale
  const showTagline = height > 32

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 320 80"
      role="img"
      aria-label="SisterRoam — Explore Fearlessly"
    >
      <title>SisterRoam</title>
      {colors.iconBgStroke ? (
        <circle cx="40" cy="40" r="36" fill={colors.iconBg} stroke={colors.iconBgStroke} strokeWidth="1" />
      ) : (
        <circle cx="40" cy="40" r="36" fill={colors.iconBg} />
      )}
      <circle cx="32" cy="30" r="10" fill={colors.iconPrimary} opacity="0.97" />
      <path
        d="M15 58c0-9.389 7.611-17 17-17s17 7.611 17 17"
        stroke={colors.iconPrimary}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="53" cy="31" r="7" fill={colors.iconSecondary} opacity="0.92" />
      <path
        d="M55.5 46 Q65 41 66.5 50"
        stroke={colors.iconSecondary}
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      <text
        x="88"
        y="44"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="34"
        fontWeight="700"
        fill={colors.textSister}
        letterSpacing="-0.8"
      >
        Sister
      </text>
      <text
        x="203"
        y="44"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="34"
        fontWeight="400"
        fill={colors.textRoam}
        letterSpacing="-0.8"
      >
        Roam
      </text>
      {showTagline && (
        <text
          x="88"
          y="62"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="11"
          fill={colors.tagline}
          letterSpacing="3.5"
        >
          EXPLORE FEARLESSLY
        </text>
      )}
    </svg>
  )
}

function IconVariant({ colors, height }) {
  const size = height

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      role="img"
      aria-label="SisterRoam"
    >
      <title>SisterRoam</title>
      {colors.iconBgStroke ? (
        <circle cx="40" cy="40" r="36" fill={colors.iconBg} stroke={colors.iconBgStroke} strokeWidth="1" />
      ) : (
        <circle cx="40" cy="40" r="36" fill={colors.iconBg} />
      )}
      <circle cx="32" cy="30" r="10" fill={colors.iconPrimary} opacity="0.97" />
      <path
        d="M15 58c0-9.389 7.611-17 17-17s17 7.611 17 17"
        stroke={colors.iconPrimary}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="53" cy="31" r="7" fill={colors.iconSecondary} opacity="0.92" />
      <path
        d="M55.5 46 Q65 41 66.5 50"
        stroke={colors.iconSecondary}
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  )
}

function WordmarkVariant({ colors, height }) {
  const scale = height / 44
  const width = 240 * scale

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 240 44"
      role="img"
      aria-label="SisterRoam"
    >
      <title>SisterRoam</title>
      <text
        x="0"
        y="34"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="34"
        fontWeight="700"
        fill={colors.textSister}
        letterSpacing="-0.8"
      >
        Sister
      </text>
      <text
        x="115"
        y="34"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="34"
        fontWeight="400"
        fill={colors.textRoam}
        letterSpacing="-0.8"
      >
        Roam
      </text>
    </svg>
  )
}

function StackedVariant({ colors, height }) {
  const size = height

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="SisterRoam — Explore Fearlessly"
    >
      <title>SisterRoam</title>
      {colors.iconBgStroke ? (
        <circle cx="100" cy="68" r="52" fill={colors.iconBg} stroke={colors.iconBgStroke} strokeWidth="1.5" />
      ) : (
        <circle cx="100" cy="68" r="52" fill={colors.iconBg} />
      )}
      <circle cx="88" cy="53" r="14" fill={colors.iconPrimary} opacity="0.97" />
      <path
        d="M64 90c0-13.255 10.745-24 24-24s24 10.745 24 24"
        stroke={colors.iconPrimary}
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="116" cy="55" r="10" fill={colors.iconSecondary} opacity="0.92" />
      <path
        d="M118.5 70 Q130 64 132 74"
        stroke={colors.iconSecondary}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      <text
        x="100"
        y="148"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="28"
        fontWeight="700"
        fill={colors.textSister}
        letterSpacing="-0.5"
        textAnchor="middle"
      >
        Sister
        <tspan fontWeight="400" fill={colors.textRoam}>Roam</tspan>
      </text>
      <text
        x="100"
        y="168"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="9"
        fill={colors.tagline}
        letterSpacing="3"
        textAnchor="middle"
      >
        EXPLORE FEARLESSLY
      </text>
    </svg>
  )
}

export default function Logo({
  variant = 'full',
  theme = 'auto',
  size = 'md',
  className,
  href,
}) {
  const colors = THEMES[theme] ?? THEMES.light
  const height = resolveHeight(size)

  let svgContent
  if (variant === 'icon') {
    svgContent = <IconVariant colors={colors} height={height} />
  } else if (variant === 'wordmark') {
    svgContent = <WordmarkVariant colors={colors} height={height} />
  } else if (variant === 'stacked') {
    svgContent = <StackedVariant colors={colors} height={height} />
  } else {
    svgContent = <FullVariant colors={colors} height={height} size={size} />
  }

  if (href) {
    return (
      <Link href={href} className={className}>
        {svgContent}
      </Link>
    )
  }

  return <span className={className}>{svgContent}</span>
}
