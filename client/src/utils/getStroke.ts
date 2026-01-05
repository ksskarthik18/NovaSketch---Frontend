import { getStroke } from 'perfect-freehand';

// FIX: Added 'size' parameter (default is 8 if not provided)
export function getSvgPathFromStroke(stroke: number[][], size: number = 8) {
  if (!stroke.length) return '';

  const d = getStroke(stroke, {
    size: size, // <--- Now uses the dynamic size
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  });

  const pathData = d.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...d[0], 'Q']
  );

  pathData.push('Z');
  return pathData.join(' ');
}