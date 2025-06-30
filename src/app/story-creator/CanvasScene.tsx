
"use client";

import React, { useRef, useEffect } from 'react';

interface CharacterAsset {
    spriteUrl: string;
    position: { x: number; y: number };
    scale: number;
    name: string;
}

interface CanvasSceneProps {
    backgroundUrl: string;
    characters: CharacterAsset[];
    width?: number;
    height?: number;
}

const CanvasScene: React.FC<CanvasSceneProps> = ({ backgroundUrl, characters, width = 1280, height = 720 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const loadedImagesRef = useRef<{ [src: string]: HTMLImageElement }>({});

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let isMounted = true;

        const allImageUrls = [backgroundUrl, ...characters.map(c => c.spriteUrl)].filter(Boolean);
        const uniqueImageUrls = [...new Set(allImageUrls)];

        let imagesToLoadCount = uniqueImageUrls.length;
        if (imagesToLoadCount === 0) {
            ctx.clearRect(0, 0, width, height); // Clear if no images
            return;
        }

        const onImageLoad = () => {
            imagesToLoadCount--;
            if (imagesToLoadCount === 0 && isMounted) {
                // All images are loaded, start the animation loop
                animate();
            }
        };

        uniqueImageUrls.forEach(src => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = onImageLoad;
            img.onerror = () => {
                console.error(`Failed to load image: ${src}`);
                onImageLoad(); // Decrement count even on error to not block animation
            };
            img.src = src;
            loadedImagesRef.current[src] = img;
        });


        const processAndDrawCharacter = (charImage: HTMLImageElement, char: CharacterAsset, time: number) => {
            if (!ctx) return;
            
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;

            tempCanvas.width = charImage.naturalWidth;
            tempCanvas.height = charImage.naturalHeight;
            tempCtx.drawImage(charImage, 0, 0);

            try {
                const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
                        data[i + 3] = 0;
                    }
                }
                tempCtx.putImageData(imageData, 0, 0);
                
                const charWidth = tempCanvas.width * char.scale;
                const charHeight = tempCanvas.height * char.scale;
                const xPos = (char.position.x / 100) * width - (charWidth / 2);
                
                // Add a subtle "breathing" or "floating" animation
                const bobbingAmount = Math.sin(time / 600 + char.position.x) * 3; // Slower, gentle bob
                const yPos = (char.position.y / 100) * height - (charHeight / 2) + bobbingAmount;
                
                ctx.drawImage(tempCanvas, xPos, yPos, charWidth, charHeight);

            } catch (e) {
                console.error("Could not process image for chroma keying, drawing as-is. Error:", e);
                const charWidth = charImage.naturalWidth * char.scale;
                const charHeight = charImage.naturalHeight * char.scale;
                const xPos = (char.position.x / 100) * width - (charWidth / 2);
                const yPos = (char.position.y / 100) * height - (charHeight / 2);
                ctx.drawImage(charImage, xPos, yPos, charWidth, charHeight);
            }
        };

        const drawScene = () => {
            if (!ctx || !isMounted) return;
            const time = Date.now();
            ctx.clearRect(0, 0, width, height);

            const bgImage = loadedImagesRef.current[backgroundUrl];
            if (bgImage && bgImage.complete) {
                ctx.drawImage(bgImage, 0, 0, width, height);
            }

            characters.forEach(char => {
                const charImage = loadedImagesRef.current[char.spriteUrl];
                if (charImage && charImage.complete) {
                    processAndDrawCharacter(charImage, char, time);
                }
            });
        };

        const animate = () => {
            if (!isMounted) return;
            drawScene();
            animationFrameId.current = requestAnimationFrame(animate);
        };

        // Cleanup function
        return () => {
            isMounted = false;
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };

    }, [backgroundUrl, characters, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full object-contain"
        />
    );
};

export default CanvasScene;
