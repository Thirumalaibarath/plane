import { Navigate } from "react-router";
// types
import type { Route } from "./+types/page";

const InstanceGitlabAuthenticationPage = function InstanceGitlabAuthenticationPage(_props: Route.ComponentProps) {
  return <Navigate to="/authentication" replace />;
};

export const meta: Route.MetaFunction = () => [{ title: "Authentication Settings - God Mode" }];

export default InstanceGitlabAuthenticationPage;
