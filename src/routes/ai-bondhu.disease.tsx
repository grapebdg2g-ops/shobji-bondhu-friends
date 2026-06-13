import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/ai-bondhu/disease")({
  component: () => <Navigate to="/disease-detection" replace />,
});
