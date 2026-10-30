/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// types
import type { Route } from "./+types/page";

function DeltaLogo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 595 554" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M311.318 0.000175227L44.0876 512.313L129.011 554L396.242 41.6873L311.318 0.000175227Z" fill="#21C00F" />
      <path d="M158.504 71.3226L481.726 552.313L561.505 501.862L238.283 20.8709L158.504 71.3226Z" fill="#21C00F" />
      <path d="M1.34268e-05 471.511L591.463 492.851L595 400.585L3.53746 379.245L1.34268e-05 471.511Z" fill="#21C00F" />
    </svg>
  );
}

const InstanceAuthenticationPage = observer(function InstanceAuthenticationPage(_props: Route.ComponentProps) {
  return (
    <PageWrapper
      header={{
        title: "Authentication",
        description: "Configure and manage authentication modes for your instance.",
      }}
    >
      <div className="space-y-4">
        <div className="shadow-sm flex flex-col gap-4 rounded-md border border-subtle bg-surface-1 p-5">
          <div className="flex items-center gap-4">
            <DeltaLogo className="size-9 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-16 font-semibold text-primary">DAuth (Single Sign-On)</h3>
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-11 font-medium">
                  <span className="bg-emerald-500 size-1.5 rounded-full" />
                  Active
                </span>
              </div>
              <p className="mt-1 text-13 text-secondary">
                Instance authentication is exclusively handled by Delta Force DAuth. Passwords and third-party OAuth
                providers are disabled.
              </p>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-3 border-t border-subtle pt-4 sm:grid-cols-2">
            <div>
              <span className="tracking-wider text-11 font-medium text-tertiary uppercase">Auth Provider</span>
              <p className="mt-0.5 text-13 font-medium text-primary">Delta Force (NIT Trichy)</p>
            </div>
            <div>
              <span className="tracking-wider text-11 font-medium text-tertiary uppercase">Auth Host</span>
              <p className="font-mono mt-0.5 text-13 text-primary">https://auth.delta.nitt.edu</p>
            </div>
            <div>
              <span className="tracking-wider text-11 font-medium text-tertiary uppercase">Scopes</span>
              <p className="font-mono mt-0.5 text-13 text-secondary">email, openid, profile, user</p>
            </div>
            <div>
              <span className="tracking-wider text-11 font-medium text-tertiary uppercase">Callback URI</span>
              <p className="font-mono mt-0.5 text-13 text-secondary">/auth/dauth/callback/</p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Authentication Settings - Plane God Mode" }];

export default InstanceAuthenticationPage;
