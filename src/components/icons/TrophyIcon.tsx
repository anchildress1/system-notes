import { FaTrophy } from 'react-icons/fa';

export default function TrophyIcon({ className }: Readonly<{ className?: string }>) {
  return <FaTrophy className={className} size={14} aria-hidden="true" focusable="false" />;
}
