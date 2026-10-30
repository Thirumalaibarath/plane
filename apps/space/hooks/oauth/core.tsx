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
    <svg viewBox="0 0 595 554" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M311.318 0.000175227L44.0876 512.313L129.011 554L396.242 41.6873L311.318 0.000175227Z" fill="#21C00F" />
      <path d="M158.504 71.3226L481.726 552.313L561.505 501.862L238.283 20.8709L158.504 71.3226Z" fill="#21C00F" />
      <path d="M1.34268e-05 471.511L591.463 492.851L595 400.585L3.53746 379.245L1.34268e-05 471.511Z" fill="#21C00F" />
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

  const isOAuthEnabled = config?.is_dauth_enabled ?? true;

  const oAuthOptions: TOAuthOption[] = [
    {
      id: "dauth",
      text: `${oauthActionText} with DAuth`,
      icon: <DAuthLogo className="h-5 w-5" />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/auth/spaces/dauth/${next_path ? `?next_path=${next_path}` : ``}`);
      },
      enabled: isOAuthEnabled,
    },
  ];

  return {
    isOAuthEnabled,
    oAuthOptions,
  };
};
