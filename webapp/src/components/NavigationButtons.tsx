import { Button } from "./ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export interface NavigationButtonsProps {
  onBack?: () => void;
  backPath?: string;
  onNext?: () => void;
  nextPath?: string;
  onBeforeNext?: () => Promise<boolean | void> | boolean | void;
  isSaving: boolean;
  isNextDisabled?: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onBack,
  backPath,
  onNext,
  nextPath,
  onBeforeNext,
  isSaving,
  isNextDisabled = false,
}) => {
  const router = useRouter();

  const handleActualBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      router.push(backPath);
    } else {
      router.back();
    }
  };

  const handleActualNext = async () => {
    if (onNext) {
      onNext();
    } else if (nextPath) {
      let proceed = true;
      if (onBeforeNext) {
        const result = await onBeforeNext();

        if (typeof result === "boolean" && !result) {
          proceed = false;
        }
      }

      if (proceed) {
        router.push(nextPath);
      }
    }
  };

  return (
    <div className="mt-5 flex w-full justify-center gap-4">
      <Button
        onClick={handleActualBack}
        className="w-44 border-2 border-gray-500 bg-white text-gray-500 hover:bg-gray-500 hover:text-white"
        disabled={isSaving}
      >
        <ArrowLeft size={18} className="mr-2" />
        <span className="relative inline-block">Tilbake</span>
      </Button>

      <Button
        onClick={handleActualNext}
        className="w-44 border-2 border-kartAI-blue bg-white text-kartAI-blue hover:bg-kartAI-blue hover:text-white"
        disabled={isSaving || isNextDisabled || !nextPath}
      >
        {isSaving ? <Loader2 className="mr-2 animate-spin" size={18} /> : null}
        <span className="relative inline-block">Neste</span>
        <ArrowRight size={18} className="ml-2" />
      </Button>
    </div>
  );
};
