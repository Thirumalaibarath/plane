import { observer } from "mobx-react";
import { Navigate } from "react-router";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";

function BillingSettingsPage() {
  const { currentWorkspace } = useWorkspace();
  const redirectPath = currentWorkspace?.slug ? `/${currentWorkspace.slug}/settings` : "/";

  return <Navigate to={redirectPath} replace />;
}

export default observer(BillingSettingsPage);
