type EmotionDefaults = {
  emotionFear?: number;
  emotionCuriosity?: number;
  emotionJoy?: number;
  emotionBoredom?: number;
  emotionHa?: number;
  publicness?: number;
  privateIntensity?: number;
};

const controls = [
  ["emotionFear", "Fear"],
  ["emotionCuriosity", "Curiosity"],
  ["emotionJoy", "Joy"],
  ["emotionBoredom", "Boredom"],
  ["emotionHa", "Ha"],
  ["privateIntensity", "Private intensity"],
  ["publicness", "Publicness"],
] as const;

export function EmotionVectorEditor({
  defaults = {},
}: {
  defaults?: EmotionDefaults;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {controls.map(([name, label]) => (
        <label key={name} className="grid gap-2">
          <span className="text-sm font-medium text-stone-700">{label}</span>
          <input
            name={name}
            type="range"
            min="0"
            max="10"
            step="1"
            defaultValue={defaults[name] ?? 0}
            className="accent-stone-950"
          />
        </label>
      ))}
    </div>
  );
}
