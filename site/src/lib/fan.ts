/** Geometry of the fan of futures (concept 09), shared by the server render and the slider script. */
export const FAN_LINES = 11;
const ORIGIN = { x: 120, y: 260 };
const END_X = 960;

export function fan(horizon: number, min: number, max: number) {
  const spread = 0.25 + ((horizon - min) / (max - min)) * 2;
  const off = (i: number) => (i - 5) * spread * 18;
  const curve = (o: number) =>
    `C400 ${ORIGIN.y} 640 ${(ORIGIN.y + o * 0.45).toFixed(1)} ${END_X} ${(ORIGIN.y + o).toFixed(1)}`;
  const lines = Array.from(
    { length: FAN_LINES },
    (_, i) => `M${ORIGIN.x} ${ORIGIN.y} ${curve(off(i))}`,
  );
  const [a, b] = [off(0), off(FAN_LINES - 1)];
  const back = `C640 ${(ORIGIN.y + b * 0.45).toFixed(1)} 400 ${ORIGIN.y} ${ORIGIN.x} ${ORIGIN.y}`;
  const band = `M${ORIGIN.x} ${ORIGIN.y} ${curve(a)} L${END_X} ${(ORIGIN.y + b).toFixed(1)} ${back} Z`;
  return { lines, band };
}
