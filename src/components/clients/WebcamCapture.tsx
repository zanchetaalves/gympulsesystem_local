
import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCcw } from "lucide-react";

interface WebcamCaptureProps {
  onCapture: (photoDataUrl: string | null) => void;
  initialImage?: string | null;
}

export function WebcamCapture({ onCapture, initialImage }: WebcamCaptureProps) {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(initialImage || null);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const webcamRef = useRef<Webcam>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setPhotoDataUrl(imageSrc);
      onCapture(imageSrc);
      setShowCamera(false);
    }
  }, [webcamRef, onCapture]);

  const retake = () => {
    setPhotoDataUrl(null);
    setShowCamera(true);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {showCamera ? (
        <div className="rounded-md overflow-hidden border border-input">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "user",
              width: 300,
              height: 300,
            }}
            width={300}
            height={300}
          />
          <div className="bg-muted p-2 flex justify-center">
            <Button onClick={capture} type="button">
              <Camera className="mr-2 h-4 w-4" /> Capturar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3">
          {photoDataUrl ? (
            <div className="relative">
              <img 
                src={photoDataUrl} 
                alt="Foto do cliente" 
                className="w-[300px] h-[300px] object-cover rounded-md border border-input"
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="absolute bottom-2 right-2"
                onClick={retake}
                type="button"
              >
                <RefreshCcw className="mr-2 h-3 w-3" /> Nova foto
              </Button>
            </div>
          ) : (
            <div 
              className="w-[300px] h-[300px] bg-muted flex items-center justify-center rounded-md border border-input"
            >
              <p className="text-muted-foreground">Sem foto</p>
            </div>
          )}
          <Button 
            variant="outline" 
            onClick={() => setShowCamera(true)} 
            type="button"
            className="w-full"
          >
            <Camera className="mr-2 h-4 w-4" /> {photoDataUrl ? "Tirar outra foto" : "Tirar foto"}
          </Button>
        </div>
      )}
    </div>
  );
}
