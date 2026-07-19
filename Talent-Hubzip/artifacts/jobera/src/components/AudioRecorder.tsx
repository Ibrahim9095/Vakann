import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, RotateCcw } from "lucide-react";

const MAX_SECONDS = 60;

type AudioRecorderProps = {
  onRecorded: (blob: Blob, durationSec: number) => void;
  disabled?: boolean;
};

export function AudioRecorder({ onRecorded, disabled }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      const secondsRef = { current: 0 };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        onRecorded(blob, secondsRef.current);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setSeconds(0);
      secondsRef.current = 0;
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => {
          const next = s + 1 >= MAX_SECONDS ? MAX_SECONDS : s + 1;
          secondsRef.current = next;
          if (s + 1 >= MAX_SECONDS) stopRecording();
          return next;
        });
      }, 1000);
    } catch {
      alert("Mikrofon icazəsi verilməyib.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSeconds(0);
    chunksRef.current = [];
  };

  return (
    <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Səs yazısı (max 1 dəqiqə)</span>
        <span className="tabular-nums text-muted-foreground">{seconds}s / {MAX_SECONDS}s</span>
      </div>
      <div className="flex gap-2">
        {!recording ? (
          <Button type="button" size="sm" onClick={startRecording} disabled={disabled}>
            <Mic className="w-4 h-4 mr-1" /> Yazmağa başla
          </Button>
        ) : (
          <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
            <Square className="w-4 h-4 mr-1" /> Dayandır
          </Button>
        )}
        {previewUrl && (
          <Button type="button" size="sm" variant="outline" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Yenidən
          </Button>
        )}
      </div>
      {previewUrl && <audio controls src={previewUrl} className="w-full" />}
    </div>
  );
}
