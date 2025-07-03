
export function fisherYateShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
  }
  
  // Function to randomly select 10 words
  export function getRandomWords(list, count = 10) {
      // Shuffle the array using Fisher-Yates algorithm
      let shuffled = [...list]
      fisherYateShuffle(shuffled)
  
      // Select the first 'count' words
      return shuffled.slice(0, count);
  }
  
function shadeColor(color, percent) {
    // Convert hex to RGB
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
  
    // Adjust the RGB values
    r = Math.round(Math.min(255, Math.max(0, r + (r * percent))));
    g = Math.round(Math.min(255, Math.max(0, g + (g * percent))));
    b = Math.round(Math.min(255, Math.max(0, b + (b * percent))));
  
    // Convert back to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;
  }
  
  // [0.2, 0.4, -0.2, -0.4, -0.6] , NEGATIVE values means darker shades
  export function generateColorShades(color, listOfShadePercents = [0.3, -0.2]) {
    const colors = [];
  
    for(const p of listOfShadePercents) {
      colors.push(shadeColor(color, p));
    }
  
    return colors;
  }
  
  export function colorGenerator(availableColors) {
    // let colors = [...availableColors];
    let colors = [];
  
    for(const c of availableColors) {
      colors.push(c)
      colors.push(...generateColorShades(c))
    }
  
    fisherYateShuffle(colors);
    console.log({
      colors
    })
  
    let nextColorFn = function() {
        return colors.pop();
    }
  
    return nextColorFn
  }

export function hslStringToHex(hslStr: string, el: HTMLElement = document.documentElement): string | null {
  // Extract the variable name from hsl(var(--some-var))
  const match = hslStr.match(/hsl\(var\((--[^)]+)\)\)/);
  if (!match) return null;

  const variableName = match[1];

  // Get the computed style value
  const computedHsl = getComputedStyle(el).getPropertyValue(variableName).trim();

  // Match HSL format: e.g. "0 0% 3.9%"
  const hslParts = computedHsl.match(/^(\d+\.?\d*)\s+(\d+\.?\d*)%\s+(\d+\.?\d*)%$/);
  if (!hslParts) return null;

  const [, h, s, l] = hslParts.map(Number);

  return hslToHex(h, s, l);
}

// HSL to HEX helper
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    Math.round(255 * (l - a * Math.max(-1, Math.min(Math.min(k(n) - 3, 9 - k(n)), 1))));
  return `#${[f(0), f(8), f(4)].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}



  // Simple event emitter for the matching game
  export class EventEmitter {
    private events: {[key: string]: Array<(data?: any) => void>} = {};
  
    on(eventName: string, callback: (data?: any) => void): void {
      if (!this.events[eventName]) {
        this.events[eventName] = [];
      }
      this.events[eventName].push(callback);
    }
  
    once(eventName: string, callback: (data?: any) => void): void {
      const onceCallback = (data?: any) => {
        callback(data);
        this.off(eventName, onceCallback);
      };
      this.on(eventName, onceCallback);
    }
  
    off(eventName: string, callback?: (data?: any) => void): void {
      if (!callback) {
        delete this.events[eventName];
      } else if (this.events[eventName]) {
        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
      }
    }
  
    emit(eventName: string, data?: any): void {
      if (this.events[eventName]) {
        this.events[eventName].forEach(callback => {
          callback(data);
        });
      }
    }
  }

  // Create a singleton instance for global use
  export const eventEmitter = new EventEmitter();
