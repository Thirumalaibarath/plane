import { Navigate } from "react-router";
// types
import type { Route } from "./+types/page";

const InstanceAIPage = function InstanceAIPage(_props: Route.ComponentProps) {
  return <Navigate to="/general" replace />;
};

export const meta: Route.MetaFunction = () => [{ title: "General Settings - God Mode" }];

export default InstanceAIPage;
