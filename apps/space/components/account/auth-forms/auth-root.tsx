/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
// plane imports
import { OAuthOptions } from "@plane/blocks/auth";
// helpers
import type { TAuthErrorInfo } from "@/helpers/authentication.helper";
import { EErrorAlertType, authErrorHandler, EAuthenticationErrorCodes } from "@/helpers/authentication.helper";
// hooks
import { useOAuthConfig } from "@/hooks/oauth";
// types
import { EAuthModes } from "@/types/auth";
// local imports
import { AuthBanner } from "./auth-banner";
import { AuthHeader } from "./auth-header";

export const AuthRoot = observer(function AuthRoot() {
  // router params
  const searchParams = useSearchParams();
  const error_code = searchParams.get("error_code") || undefined;
  // states
  const [authMode, setAuthMode] = useState<EAuthModes>(EAuthModes.SIGN_UP);
  const [errorInfo, setErrorInfo] = useState<TAuthErrorInfo | undefined>(undefined);
  // hooks
  const oAuthActionText = authMode === EAuthModes.SIGN_UP ? "Sign up" : "Sign in";
  const { isOAuthEnabled, oAuthOptions } = useOAuthConfig(oAuthActionText);

  useEffect(() => {
    if (error_code) {
      const errorhandler = authErrorHandler(error_code?.toString() as EAuthenticationErrorCodes);
      if (errorhandler) {
        if (errorhandler.code === EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_IN) {
          setAuthMode(EAuthModes.SIGN_IN);
        }
        if (errorhandler.code === EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_UP) {
          setAuthMode(EAuthModes.SIGN_UP);
        }
        setErrorInfo(errorhandler);
      }
    }
  }, [error_code]);

  return (
    <div className="mt-10 flex w-full flex-grow flex-col items-center justify-center py-6">
      <div className="relative flex w-full max-w-[22.5rem] flex-col gap-6">
        {errorInfo && errorInfo?.type === EErrorAlertType.BANNER_ALERT && (
          <AuthBanner bannerData={errorInfo} handleBannerData={(value) => setErrorInfo(value)} />
        )}
        <AuthHeader authMode={authMode} />
        {isOAuthEnabled && <OAuthOptions options={oAuthOptions} compact={false} showDivider={false} />}
      </div>
    </div>
  );
});
