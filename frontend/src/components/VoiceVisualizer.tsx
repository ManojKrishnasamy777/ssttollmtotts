import { useEffect, useRef } from 'react';

interface VoiceVisualizerProps {
  isActive: boolean;
}

export const VoiceVisualizer = ({ isActive }: VoiceVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    let phase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      if (isActive) {
        const numCircles = 3;
        for (let i = 0; i < numCircles; i++) {
          const radius = 40 + i * 20 + Math.sin(phase + i * 0.5) * 10;
          const opacity = 0.3 - i * 0.08;

          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        const numWaves = 8;
        for (let i = 0; i < numWaves; i++) {
          const angle = (i / numWaves) * Math.PI * 2;
          const length = 60 + Math.sin(phase + i) * 20;
          const x1 = centerX + Math.cos(angle) * 30;
          const y1 = centerY + Math.sin(angle) * 30;
          const x2 = centerX + Math.cos(angle) * (30 + length);
          const y2 = centerY + Math.sin(angle) * (30 + length);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.6 - (length / 80) * 0.3})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        phase += 0.1;
      } else {
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(156, 163, 175, 0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      style={{
        display: 'block',
        margin: '0 auto',
      }}
    />
  );
};
