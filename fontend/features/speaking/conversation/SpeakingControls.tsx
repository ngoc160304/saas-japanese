import { Button } from '@/components/ui/button';

interface SpeakingControlsProps {
  onEnd: () => void;
  microphoneEnabled: boolean;
  microphonePending: boolean;
  onToggleMicrophone: () => void;
}

export default function SpeakingControls({
  onEnd,
  microphoneEnabled,
  microphonePending,
  onToggleMicrophone,
}: SpeakingControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button
        type="button"
        aria-pressed={microphoneEnabled}
        disabled={microphonePending}
        onClick={onToggleMicrophone}
        className="h-10 rounded-xl px-5"
      >
        {microphonePending ? 'Đang xử lý…' : microphoneEnabled ? 'Tắt micro' : 'Bật micro'}
      </Button>
      <Button
        type="button"
        onClick={onEnd}
        variant="destructive"
        className="h-10 rounded-xl border border-rose-200 px-5"
      >
        Kết thúc
      </Button>
    </div>
  );
}
