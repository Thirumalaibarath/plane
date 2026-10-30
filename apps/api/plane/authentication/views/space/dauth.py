# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import uuid

# Django import
from django.http import HttpResponseRedirect
from django.views import View

# Module imports
from plane.authentication.provider.oauth.dauth import DAuthOAuthProvider
from plane.authentication.utils.login import user_login
from plane.authentication.utils.oauth_state import validate_oauth_state
from plane.license.models import Instance
from plane.authentication.utils.host import base_host
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.utils.path_validator import get_safe_redirect_url, validate_next_path, get_allowed_hosts


class DAuthInitiateSpaceEndpoint(View):
    def get(self, request):
        request.session["host"] = base_host(request=request, is_space=True)
        next_path = request.GET.get("next_path")

        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_space=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)

        try:
            state = uuid.uuid4().hex
            provider = DAuthOAuthProvider(request=request, state=state)
            request.session["state"] = state
            auth_url = provider.get_auth_url()
            return HttpResponseRedirect(auth_url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_space=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)


class DAuthCallbackSpaceEndpoint(View):
    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        next_path = request.session.get("next_path")

        if not validate_oauth_state(request=request, state=state):
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["DAUTH_OAUTH_PROVIDER_ERROR"],
                error_message="DAUTH_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_space=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)
        if not code:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["DAUTH_OAUTH_PROVIDER_ERROR"],
                error_message="DAUTH_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_space=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)
        try:
            provider = DAuthOAuthProvider(request=request, code=code)
            user = provider.authenticate()
            # Login the user and record his device info
            user_login(request=request, user=user, is_space=True)
            # Get the redirection path
            path = validate_next_path(
                next_path=next_path, allowed_hosts=get_allowed_hosts(base_host(request=request, is_space=True))
            )
            url = get_safe_redirect_url(base_url=base_host(request=request, is_space=True), next_path=path, params={})
            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_space=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)
