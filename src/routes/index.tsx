import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/components/Game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spelling Blocks — Daily Word Puzzle" },
      {
        name: "description",
        content: "Twelve letter blocks. Use every one. A free daily puzzle.",
      },
      { property: "og:title", content: "Spelling Blocks — Daily Word Puzzle" },
      {
        property: "og:description",
        content: "Twelve letter blocks. Use every one. A free daily puzzle.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  return <Game />;
}
