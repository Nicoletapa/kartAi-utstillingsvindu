import { Loader2 } from "lucide-react";
interface Props {
  text: string;
}

export const LoadingIndicator: React.FC<Props> = ({ text }) => (
  <div className="flex h-full items-center justify-center">
    <Loader2 className="animate-spin text-gray-500" size={24} />
    <span className="ml-3">{text}</span>
  </div>
);
