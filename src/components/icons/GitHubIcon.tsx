import { FaGithub } from 'react-icons/fa';

export default function GitHubIcon({ className }: Readonly<{ className?: string }>) {
  return <FaGithub className={className} size={18} aria-hidden="true" focusable="false" />;
}
