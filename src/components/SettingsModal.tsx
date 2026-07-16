import { useState } from "react";

export function SettingsBody({
  initialSound,
  onChangeSound,
}: {
  initialSound: boolean;
  onChangeSound: (v: boolean) => void;
}) {
  const [sound, setSound] = useState(initialSound);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 12,
          border: "1px solid rgba(38,34,27,0.2)",
          borderRadius: 10,
        }}
      >
        <span style={{ fontWeight: 600 }}>Sound</span>
        <input
          type="checkbox"
          checked={sound}
          onChange={(e) => {
            setSound(e.target.checked);
            onChangeSound(e.target.checked);
          }}
          style={{ width: 20, height: 20 }}
        />
      </label>
    </div>
  );
}
