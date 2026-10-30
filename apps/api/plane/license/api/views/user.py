# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.license.api.views.base import BaseAPIView
from plane.license.api.permissions import InstanceAdminPermission
from plane.db.models import User, WorkspaceMember
from plane.license.models import InstanceAdmin


class InstanceUserEndpoint(BaseAPIView):
    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        users = User.objects.filter(is_bot=False).order_by("-created_at")
        admin_user_ids = set(InstanceAdmin.objects.filter(role__gte=15).values_list("user_id", flat=True))

        data = []
        for u in users:
            workspace_memberships = WorkspaceMember.objects.filter(member=u, is_active=True).select_related("workspace")
            workspaces = [
                {
                    "id": str(wm.workspace.id),
                    "name": wm.workspace.name,
                    "slug": wm.workspace.slug,
                    "role": wm.role,
                }
                for wm in workspace_memberships
            ]
            data.append(
                {
                    "id": str(u.id),
                    "email": u.email,
                    "first_name": u.first_name,
                    "last_name": u.last_name,
                    "display_name": u.display_name or f"{u.first_name} {u.last_name}".strip() or u.email,
                    "avatar": u.avatar,
                    "is_active": u.is_active,
                    "is_superuser": u.is_superuser or (u.id in admin_user_ids),
                    "created_at": u.created_at,
                    "last_login": u.last_login,
                    "workspaces": workspaces,
                }
            )
        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request, pk=None):
        user_id = request.data.get("user_id") or pk
        if not user_id:
            return Response({"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(id=user_id, is_bot=False).first()
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        if "is_active" in request.data:
            user.is_active = bool(request.data["is_active"])
            user.save(update_fields=["is_active"])
        return Response({"status": "success", "is_active": user.is_active}, status=status.HTTP_200_OK)
