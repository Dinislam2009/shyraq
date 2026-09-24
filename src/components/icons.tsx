type IconProps = { size?: number; strokeWidth?: number };

const base = (props: IconProps) => ({
  width: props.size ?? 20,
  height: props.size ?? 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: props.strokeWidth ?? 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function HomeIcon(props: IconProps) {
  return <svg {...base(props)}><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></svg>;
}
export function LayersIcon(props: IconProps) {
  return <svg {...base(props)}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 16 9 5 9-5" /></svg>;
}
export function PlayIcon(props: IconProps) {
  return <svg {...base(props)}><path d="m8 5 11 7-11 7V5Z" /></svg>;
}
export function ChartIcon(props: IconProps) {
  return <svg {...base(props)}><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 3-4 3 2 5-6" /></svg>;
}
export function SettingsIcon(props: IconProps) {
  return <svg {...base(props)}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.3a2 2 0 1 1-4 0v-.2A2 2 0 0 0 5.8 18l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 1.6 12a2 2 0 0 1 0-4h.2A2 2 0 0 0 3 4.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A2 2 0 0 0 9.2.5h.3a2 2 0 1 1 4 0v.2A2 2 0 0 0 17 2.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A2 2 0 0 0 21.2 8h.2a2 2 0 1 1 0 4h-.2a2 2 0 0 0-1.8 3Z" transform="translate(1.4 1.5) scale(.88)" /></svg>;
}
export function PlusIcon(props: IconProps) {
  return <svg {...base(props)}><path d="M12 5v14M5 12h14" /></svg>;
}
export function SearchIcon(props: IconProps) {
  return <svg {...base(props)}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>;
}
export function ChevronRightIcon(props: IconProps) {
  return <svg {...base(props)}><path d="m9 6 6 6-6 6" /></svg>;
}
export function FlameIcon(props: IconProps) {
  return <svg {...base(props)}><path d="M12 22c4 0 7-2.6 7-6.6 0-3.4-2.1-5.7-4.3-7.9.1 2.2-1 3.8-2.3 4.7.1-3.8-1.6-6.7-4.5-8.9.3 4.6-3.1 6.8-3.1 11.3C4.8 19.4 7.6 22 12 22Z" /></svg>;
}
export function ClockIcon(props: IconProps) {
  return <svg {...base(props)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>;
}
export function CheckIcon(props: IconProps) {
  return <svg {...base(props)}><path d="m5 12 4 4L19 6" /></svg>;
}