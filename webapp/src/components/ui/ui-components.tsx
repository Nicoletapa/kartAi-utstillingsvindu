import React from "react";
import { Info } from "lucide-react";

// Tooltip component
interface TooltipProps {
  id: string;
  title?: string;
  content: string;
  isVisible: boolean;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
}

export const Tooltip: React.FC<TooltipProps> = ({
  id,
  title,
  content,
  isVisible,
  onMouseEnter,
  onMouseLeave,
}) => {
  // Hvis ingen tittel er gitt, kan vi rendre Info-ikonet direkte
  // eller ha en litt annen struktur.
  // Her velger jeg å rendre Info-ikonet med sin relative div,
  // og kun wrappe med <h1> hvis tittelen finnes.

  const tooltipTriggerContent = (
    <div className="relative flex">
      <Info
        size={14}
        className="ml-1 hover:cursor-pointer"
        onMouseEnter={() => onMouseEnter(id)}
        onMouseLeave={onMouseLeave}
      />
      {isVisible && (
        <div
          className="absolute left-6 top-0 z-10 w-64 rounded-lg border bg-white p-3 text-sm shadow-lg"
          onMouseEnter={() => onMouseEnter(id)}
          onMouseLeave={onMouseLeave}
        >
          {content}
        </div>
      )}
    </div>
  );

  if (title) {
    return (
      <h1 className="inline-flex items-center font-medium">
        {title}
        {tooltipTriggerContent}
      </h1>
    );
  }
  return tooltipTriggerContent;
};

interface UseTooltipReturn {
  hoveredItem: string | null;
  handleMouseEnter: (id: string) => void;
  handleMouseLeave: () => void;
  isVisible: (id: string) => boolean;
}
export const useTooltip = (): UseTooltipReturn => {
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [timeoutId, setTimeoutId] = React.useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = React.useCallback(
    (id: string) => {
      if (timeoutId) clearTimeout(timeoutId);
      setHoveredItem(id);
    },
    [timeoutId],
  );

  const handleMouseLeave = React.useCallback(() => {
    const id = setTimeout(() => setHoveredItem(null), 300);
    setTimeoutId(id);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  return {
    hoveredItem,
    handleMouseEnter,
    handleMouseLeave,
    isVisible: (id: string) => hoveredItem === id,
  };
};
