
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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Combine all image sources to load them at once
        const allImageUrls = [backgroundUrl, ...characters.map(c => c.spriteUrl)].filter(Boolean);
        const uniqueImageUrls = [...new Set(allImageUrls)];

        const images: { [src: string]: HTMLImageElement } = {};
        let loadedImages = 0;

        const processAndDrawCharacter = (charImage: HTMLImageElement, char: CharacterAsset) => {
            if (!ctx) return;
            
            // Create a temporary canvas to process the sprite
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;

            tempCanvas.width = charImage.naturalWidth;
            tempCanvas.height = charImage.naturalHeight;
            tempCtx.drawImage(charImage, 0, 0);

            try {
                const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const data = imageData.data;

                // Make white and near-white pixels transparent
                for (let i = 0; i < data.length; i += 4) {
                    const red = data[i];
                    const green = data[i + 1];
                    const blue = data[i + 2];
                    
                    // If the pixel is close to white (to account for slight variations)
                    if (red > 240 && green > 240 && blue > 240) {
                        data[i + 3] = 0; // Set alpha to 0 (fully transparent)
                    }
                }
                tempCtx.putImageData(imageData, 0, 0);

                // Draw the processed sprite onto the main canvas
                const charWidth = tempCanvas.width * char.scale;
                const charHeight = tempCanvas.height * char.scale;
                const xPos = (char.position.x / 100) * width - (charWidth / 2);
                const yPos = (char.position.y / 100) * height - (charHeight / 2);
                
                ctx.drawImage(tempCanvas, xPos, yPos, charWidth, charHeight);

            } catch (e) {
                console.error("Could not process image for chroma keying, drawing as-is. Error:", e);
                // Fallback to drawing the original image if processing fails
                const charWidth = charImage.naturalWidth * char.scale;
                const charHeight = charImage.naturalHeight * char.scale;
                const xPos = (char.position.x / 100) * width - (charWidth / 2);
                const yPos = (char.position.y / 100) * height - (charHeight / 2);
                ctx.drawImage(charImage, xPos, yPos, charWidth, charHeight);
            }
        };

        const drawScene = () => {
            // Clear canvas
            ctx.clearRect(0, 0, width, height);
            
            // Draw background
            const bgImage = images[backgroundUrl];
            if (bgImage) {
                ctx.drawImage(bgImage, 0, 0, width, height);
            }

            // Draw characters
            characters.forEach(char => {
                const charImage = images[char.spriteUrl];
                if (charImage) {
                    processAndDrawCharacter(charImage, char);
                }
            });
        };
        
        // Preload all images
        if (uniqueImageUrls.length === 0) {
            // If there's a background URL but no characters, just draw the background
            if(backgroundUrl) {
                const bgImg = new Image();
                bgImg.crossOrigin = "anonymous";
                bgImg.src = backgroundUrl;
                bgImg.onload = () => {
                    ctx.clearRect(0, 0, width, height);
                    ctx.drawImage(bgImg, 0, 0, width, height);
                }
            } else {
                 ctx.clearRect(0, 0, width, height);
            }
            return;
        }

        uniqueImageUrls.forEach(src => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;
            img.onload = () => {
                images[src] = img;
                loadedImages++;
                if (loadedImages === uniqueImageUrls.length) {
                    drawScene();
                }
            };
            img.onerror = () => {
                 console.error(`Failed to load image: ${src}`);
                 loadedImages++;
                 if (loadedImages === uniqueImageUrls.length) {
                    drawScene();
                }
            }
        });

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
