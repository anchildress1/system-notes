import { FaDev } from 'react-icons/fa';

export default function DevIcon({ className }: Readonly<{ className?: string }>) {
  return <FaDev className={className} size={18} aria-hidden="true" focusable="false" />;
}
