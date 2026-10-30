# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import os
import re
import uuid
from urllib.parse import urlencode, urlparse
import requests

# Module imports
from plane.authentication.adapter.oauth import OauthAdapter
from plane.license.utils.instance_value import get_configuration_value
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)


class DAuthOAuthProvider(OauthAdapter):
    provider = "dauth"
    scope = "email openid profile user"

    def __init__(self, request, code=None, state=None, callback=None):
        (DAUTH_CLIENT_ID, DAUTH_CLIENT_SECRET, DAUTH_HOST, DAUTH_REDIRECT_URI) = get_configuration_value(
            [
                {
                    "key": "DAUTH_CLIENT_ID",
                    "default": os.environ.get("DAUTH_CLIENT_ID"),
                },
                {
                    "key": "DAUTH_CLIENT_SECRET",
                    "default": os.environ.get("DAUTH_CLIENT_SECRET"),
                },
                {
                    "key": "DAUTH_HOST",
                    "default": os.environ.get("DAUTH_HOST", "https://auth.delta.nitt.edu"),
                },
                {
                    "key": "DAUTH_REDIRECT_URI",
                    "default": os.environ.get("DAUTH_REDIRECT_URI"),
                },
            ]
        )

        DAUTH_CLIENT_ID = DAUTH_CLIENT_ID or os.environ.get("DAUTH_CLIENT_ID")
        DAUTH_CLIENT_SECRET = DAUTH_CLIENT_SECRET or os.environ.get("DAUTH_CLIENT_SECRET")
        DAUTH_HOST = DAUTH_HOST or os.environ.get("DAUTH_HOST", "https://auth.delta.nitt.edu")
        DAUTH_REDIRECT_URI = DAUTH_REDIRECT_URI or os.environ.get("DAUTH_REDIRECT_URI")

        if not (DAUTH_CLIENT_ID and DAUTH_CLIENT_SECRET):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["DAUTH_NOT_CONFIGURED"],
                error_message="DAUTH_NOT_CONFIGURED",
            )

        dauth_host = (DAUTH_HOST or "https://auth.delta.nitt.edu").rstrip("/")
        parsed = urlparse(dauth_host)
        if not parsed.scheme or parsed.scheme not in ("https", "http"):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["DAUTH_NOT_CONFIGURED"],
                error_message="DAUTH_NOT_CONFIGURED",
            )

        self.token_url = f"{dauth_host}/api/oauth/token"
        self.userinfo_url = f"{dauth_host}/api/resources/user"

        client_id = DAUTH_CLIENT_ID
        client_secret = DAUTH_CLIENT_SECRET

        if DAUTH_REDIRECT_URI:
            redirect_uri = DAUTH_REDIRECT_URI
        else:
            redirect_uri = (
                f"""{"https" if request.is_secure() else "http"}://{request.get_host()}/auth/dauth/callback/"""
            )

        nonce = uuid.uuid4().hex
        url_params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "grant_type": "authorization_code",
            "state": state,
            "scope": self.scope,
            "nonce": nonce,
        }
        auth_url = f"{dauth_host}/authorize?{urlencode(url_params)}"

        super().__init__(
            request,
            self.provider,
            client_id,
            self.scope,
            redirect_uri,
            auth_url,
            self.token_url,
            self.userinfo_url,
            client_secret,
            code,
            callback=callback,
        )

    def set_token_data(self):
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "authorization_code",
            "code": self.code,
            "redirect_uri": self.redirect_uri,
        }
        token_response = self.get_user_token(data=data)
        super().set_token_data(
            {
                "access_token": token_response.get("access_token"),
                "refresh_token": token_response.get("refresh_token", None),
                "id_token": token_response.get("id_token", ""),
            }
        )

    def get_user_response(self):
        """
        DAuth uses POST /api/resources/user with Bearer access token.
        """
        try:
            headers = {"Authorization": f"Bearer {self.token_data.get('access_token')}"}
            response = requests.post(self.get_user_info_url(), headers=headers, timeout=15)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            self.logger.warning(f"Error getting DAuth user response: {e}")
            code = self.authentication_error_code()
            raise AuthenticationException(error_code=AUTHENTICATION_ERROR_CODES[code], error_message=str(code))

    def set_user_data(self):
        user_info = self.get_user_response()
        email = user_info.get("email")
        if not email:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["DAUTH_OAUTH_PROVIDER_ERROR"],
                error_message="DAUTH_EMAIL_MISSING",
            )

        name = (user_info.get("name") or "").strip()
        if " " in name:
            first_name, last_name = name.split(" ", 1)
        else:
            first_name = name or "Delta"
            last_name = "Member"

        # Detect student roll number from email or payload
        roll_number = user_info.get("rollNumber") or user_info.get("roll_number") or ""
        if not roll_number and "@" in email:
            local_part = email.split("@")[0]
            if re.match(r"^\d{7,10}$", local_part):
                roll_number = local_part

        display_name = f"{name} ({roll_number})" if roll_number and name else (name or email)

        provider_id = str(user_info.get("id") or user_info.get("userId") or roll_number or email)

        user_data = {
            "email": email,
            "user": {
                "avatar": user_info.get("avatar") or user_info.get("picture") or "",
                "first_name": first_name,
                "last_name": last_name,
                "display_name": display_name,
                "provider_id": provider_id,
                "is_password_autoset": True,
            },
        }
        super().set_user_data(user_data)
