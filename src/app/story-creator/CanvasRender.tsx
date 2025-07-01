// import React, { useRef, useEffect, useState } from 'react';

// interface SceneObject {
//   type: "circle";
//   color: string;
//   x: number;
//   y: number;
//   dx?: number;
//   dy?: number;
//   gravity?: number;
//   radius: number;
// }

// interface Scene {
//   sentence: string;
//   duration: number;
//   background: string;
//   objects: SceneObject[];
// }

// const scenes: Scene[] = [
//   {
//     sentence: "A red ball rolled across a green field.",
//     duration: 4000,
//     objects: [
//       { type: "circle", color: "red", x: 0, y: 150, dx: 2, dy: 0, radius: 20 }
//     ],
//     background: "#88cc88"
//   },
//   {
//     sentence: "It bounced into the air.",
//     duration: 4000,
//     objects: [
//       { type: "circle", color: "red", x: 200, y: 150, dx: 0, dy: -5, gravity: 0.3, radius: 20 }
//     ],
//     background: "#88cc88"
//   }
// ];

// export default function AnimatedStoryCanvas(): JSX.Element {
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
//   const [sentence, setSentence] = useState<string>(scenes[0].sentence);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     canvas.width = 600;
//     canvas.height = 300;

//     let frameId: number;
//     let startTime: number | null = null;
//     const sceneObjects: SceneObject[] = JSON.parse(JSON.stringify(scenes[currentSceneIndex].objects));
//     const bg = scenes[currentSceneIndex].background;

//     const render = (timestamp: number) => {
//       if (startTime === null) startTime = timestamp;
//       const elapsed = timestamp - startTime;

//       ctx.fillStyle = bg;
//       ctx.fillRect(0, 0, canvas.width, canvas.height);

//       for (let obj of sceneObjects) {
//         if (obj.type === "circle") {
//           ctx.beginPath();
//           ctx.fillStyle = obj.color;
//           ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
//           ctx.fill();

//           obj.x += obj.dx || 0;
//           obj.y += obj.dy || 0;

//           if (obj.gravity) obj.dy = (obj.dy || 0) + obj.gravity;
//           if (obj.y + obj.radius > canvas.height) {
//             obj.y = canvas.height - obj.radius;
//             if (obj.dy) obj.dy *= -0.7;
//           }
//         }
//       }

//       if (elapsed < scenes[currentSceneIndex].duration) {
//         frameId = requestAnimationFrame(render);
//       } else {
//         if (currentSceneIndex + 1 < scenes.length) {
//           setTimeout(() => {
//             setCurrentSceneIndex(i => i + 1);
//             setSentence(scenes[currentSceneIndex + 1].sentence);
//           }, 500);
//         }
//       }
//     };

//     frameId = requestAnimationFrame(render);

//     return () => cancelAnimationFrame(frameId);
//   }, [currentSceneIndex]);

//   return (
//     <div className="flex flex-col items-center">
//       <canvas ref={canvasRef} className="border rounded shadow" />
//       <p className="mt-4 text-lg font-medium">{sentence}</p>
//     </div>
//   );
// }



import React, { useRef, useEffect, useState } from 'react';

interface CartoonObject {
  type: "sun" | "tree" | "house" | "dog" | "circle";
  x: number;
  y: number;
  dx?: number;
  dy?: number;
  radius?: number;
  color?: string;
  face?: boolean;
}

interface VectorScene {
  sentence: string;
  duration: number;
  background: string;
  objects: CartoonObject[];
}

const scenes: VectorScene[] = [
  {
    sentence: "A cartoon sun smiles over a house and a tree.",
    duration: 5000,
    background: "skyblue",
    objects: [
      { type: "sun", x: 500, y: 60, radius: 40, face: true },
      { type: "house", x: 200, y: 180 },
      { type: "tree", x: 100, y: 160 }
    ]
  },
  {
    sentence: "A dog runs happily across the ground.",
    duration: 5000,
    background: "skyblue",
    objects: [
      { type: "dog", x: 0, y: 250, dx: 2 }
    ]
  }
];

export default function AnimatedStoryCanvas(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [sentence, setSentence] = useState<string>(scenes[0].sentence);

  const drawObject = (ctx: CanvasRenderingContext2D, obj: CartoonObject) => {
    switch (obj.type) {
      case "sun":
        ctx.beginPath();
        ctx.fillStyle = "yellow";
        ctx.arc(obj.x, obj.y, obj.radius || 40, 0, Math.PI * 2);
        ctx.fill();
        if (obj.face) {
          ctx.fillStyle = "black";
          ctx.beginPath();
          ctx.arc(obj.x - 10, obj.y - 10, 5, 0, Math.PI * 2);
          ctx.arc(obj.x + 10, obj.y - 10, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(obj.x, obj.y + 5, 10, 0, Math.PI);
          ctx.stroke();
        }
        break;
      case "tree":
        ctx.fillStyle = "brown";
        ctx.fillRect(obj.x + 10, obj.y + 40, 10, 40);
        ctx.beginPath();
        ctx.fillStyle = "green";
        ctx.arc(obj.x + 15, obj.y + 30, 30, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "house":
        ctx.fillStyle = "#cc4444";
        ctx.fillRect(obj.x, obj.y, 100, 80);
        ctx.beginPath();
        ctx.moveTo(obj.x, obj.y);
        ctx.lineTo(obj.x + 50, obj.y - 50);
        ctx.lineTo(obj.x + 100, obj.y);
        ctx.closePath();
        ctx.fillStyle = "#884422";
        ctx.fill();
        break;
      case "dog":
        ctx.fillStyle = "brown";
        ctx.fillRect(obj.x, obj.y, 40, 20);
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(obj.x + 30, obj.y + 5, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 300;

    let frameId: number;
    let startTime: number | null = null;
    const objects: CartoonObject[] = JSON.parse(JSON.stringify(scenes[currentSceneIndex].objects));
    const bg = scenes[currentSceneIndex].background;

    const render = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let obj of objects) {
        drawObject(ctx, obj);
        if (obj.dx) obj.x += obj.dx;
        if (obj.dy) obj.y += obj.dy;
      }

      if (elapsed < scenes[currentSceneIndex].duration) {
        frameId = requestAnimationFrame(render);
      } else {
        if (currentSceneIndex + 1 < scenes.length) {
          setTimeout(() => {
            setCurrentSceneIndex(i => i + 1);
            setSentence(scenes[currentSceneIndex + 1].sentence);
          }, 500);
        }
      }
    };

    frameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(frameId);
  }, [currentSceneIndex]);

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} className="border rounded shadow" />
      <p className="mt-4 text-lg font-medium">{sentence}</p>
    </div>
  );
}
