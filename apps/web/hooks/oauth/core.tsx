/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@plane/constants";
import type { TOAuthConfigs, TOAuthOption } from "@plane/types";
// hooks
import { useInstance } from "@/hooks/store/use-instance";

function DAuthLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M20 5L36 34H4L20 5Z" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 14L29 30H11L20 14Z" fill="#10B981" />
    </svg>
  );
}

export const useCoreOAuthConfig = (oauthActionText: string): TOAuthConfigs => {
  // router
  const searchParams = useSearchParams();
  // query params
  const next_path = searchParams.get("next_path");
  // store hooks
  const { config } = useInstance();

  // DAuth is the exclusive authentication provider
  const isOAuthEnabled = config?.is_dauth_enabled ?? true;

  const oAuthOptions: TOAuthOption[] = [
    {
      id: "dauth",
      text: `${oauthActionText} with DAuth`,
      icon: <DAuthLogo className="h-5 w-5" />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/auth/dauth/${next_path ? `?next_path=${next_path}` : ``}`);
      },
      enabled: isOAuthEnabled,
    },
  ];

  return {
    isOAuthEnabled,
    oAuthOptions,
  };
};
