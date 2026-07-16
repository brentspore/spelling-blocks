import { Block } from "./Block";

export function HelpBody() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontSize: 15 }}>
      <Step
        n={1}
        title="Build words"
        demo={
          <MiniRow
            letters={[
              ["C", "cobalt"],
              ["A", "butter"],
              ["T", "grass"],
            ]}
          />
        }
        body="Tap blocks to form a word of three or more letters. Tap Place word to add it to your wall."
      />
      <Step
        n={2}
        title="Use every block"
        demo={
          <MiniRow
            letters={[
              ["A", "cobalt"],
              ["B", "butter"],
              ["C", "cherry"],
              ["D", "grass"],
            ]}
          />
        }
        body="You start with twelve blocks. Every block must end up in a word. No leftovers."
      />
      <Step
        n={3}
        title="Beat par"
        demo={
          <MiniRow
            letters={[
              ["P", "cherry"],
              ["A", "butter"],
              ["R", "grass"],
            ]}
          />
        }
        body="Each puzzle has a target word count. Finish at or under par for a clean solve."
      />
    </div>
  );
}

function Step({
  n,
  title,
  body,
  demo,
}: {
  n: number;
  title: string;
  body: string;
  demo: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 800,
          fontSize: 28,
          minWidth: 36,
        }}
      >
        {n}
      </div>
      <div>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
        <div style={{ marginBottom: 8 }}>{demo}</div>
        <div style={{ opacity: 0.8 }}>{body}</div>
      </div>
    </div>
  );
}

function MiniRow({ letters }: { letters: [string, "cobalt" | "grass" | "butter" | "cherry"][] }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {letters.map(([l, c], i) => (
        <Block key={i} letter={l} color={c} size={32} variant="placed" />
      ))}
    </div>
  );
}
