/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { UsageOutline } from "@makeplane/propel/icons";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { Switch } from "@makeplane/propel/components/switch";
import type { IInstance, IInstanceAdmin } from "@plane/types";
// components
import { ControllerInput } from "@/components/common/controller-input";
import { setToast } from "@plane/blocks/toast";
// hooks
import { useInstance } from "@/hooks/store";

export interface IGeneralConfigurationForm {
  instance: IInstance;
  instanceAdmins: IInstanceAdmin[];
}

export const GeneralConfigurationForm = observer(function GeneralConfigurationForm(props: IGeneralConfigurationForm) {
  const { instance, instanceAdmins } = props;
  // hooks
  const { updateInstanceInfo, formattedConfig, updateInstanceConfigurations, fetchInstanceConfigurations } =
    useInstance();

  const [discordUrl, setDiscordUrl] = useState<string>(formattedConfig?.DISCORD_URL ?? "");

  useEffect(() => {
    void fetchInstanceConfigurations();
  }, [fetchInstanceConfigurations]);

  useEffect(() => {
    if (formattedConfig?.DISCORD_URL !== undefined) {
      setDiscordUrl(formattedConfig.DISCORD_URL);
    }
  }, [formattedConfig?.DISCORD_URL]);

  // form data
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Partial<IInstance>>({
    defaultValues: {
      instance_name: instance?.instance_name,
      is_telemetry_enabled: instance?.is_telemetry_enabled,
    },
  });

  const onSubmit = async (formData: Partial<IInstance>) => {
    const payload: Partial<IInstance> = { ...formData };

    try {
      await Promise.all([
        updateInstanceInfo(payload),
        updateInstanceConfigurations({ DISCORD_URL: discordUrl.trim() }),
      ]);
      setToast({
        type: "success",
        title: "Success",
        message: "Settings updated successfully",
      });
    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        title: "Error",
        message: "Failed to update settings",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="text-16 font-medium text-primary">Instance details</div>
        <div className="grid-col grid w-full grid-cols-1 items-center justify-between gap-8 md:grid-cols-2 lg:grid-cols-3">
          <ControllerInput
            key="instance_name"
            name="instance_name"
            control={control}
            type="text"
            label="Name of instance"
            placeholder="Instance name"
            error={Boolean(errors.instance_name)}
            required
          />

          <div className="flex flex-col gap-1">
            <h4 className="text-13 text-tertiary">Email</h4>
            <div className="w-full">
              <InputGroup size="lg">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  size="lg"
                  value={instanceAdmins[0]?.user_detail?.email ?? ""}
                  placeholder="Admin email"
                  autoComplete="on"
                  disabled
                />
              </InputGroup>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h4 className="text-13 text-tertiary">Instance ID</h4>
            <div className="w-full">
              <InputGroup size="lg">
                <Input
                  id="instance_id"
                  name="instance_id"
                  type="text"
                  size="lg"
                  value={instance.instance_id}
                  disabled
                />
              </InputGroup>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border-b border-subtle pb-1.5 text-16 font-medium text-primary">Telemetry</div>
        <div className="flex items-center gap-14">
          <div className="flex grow items-center gap-4">
            <div className="shrink-0">
              <div className="flex size-11 items-center justify-center rounded-lg bg-layer-1">
                <UsageOutline className="size-5 text-tertiary" />
              </div>
            </div>
            <div className="grow">
              <div className="text-13 leading-5 font-medium text-primary">Let Plane collect anonymous usage data</div>
              <div className="text-11 leading-5 font-regular text-tertiary">
                No PII is collected.This anonymized data is used to understand how you use Plane and build new features
                in line with{" "}
                <a
                  href="https://developers.plane.so/self-hosting/telemetry"
                  target="_blank"
                  className="text-accent-primary hover:underline"
                  rel="noreferrer"
                >
                  our Telemetry Policy.
                </a>
              </div>
            </div>
          </div>
          <div className={`shrink-0 ${isSubmitting && "opacity-70"}`}>
            <Controller
              control={control}
              name="is_telemetry_enabled"
              render={({ field: { value, onChange } }) => (
                <Switch
                  aria-label="Let Plane collect anonymous usage data"
                  checked={value ?? false}
                  onCheckedChange={onChange}
                  size="sm"
                  disabled={isSubmitting}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Community & Discord */}
      <div className="space-y-4">
        <div className="border-b border-subtle pb-1.5 text-16 font-medium text-primary">Community & Support</div>
        <div className="max-w-xl space-y-2">
          <label className="text-13 font-medium text-primary" htmlFor="discord_url">
            Discord Server URL
          </label>
          <div className="text-11 leading-5 font-regular text-tertiary">
            Provide the invite link to your organization&apos;s Discord server. When set, a Discord button will be
            displayed on the top right navigation bar for all users.
          </div>
          <InputGroup size="lg">
            <Input
              id="discord_url"
              name="discord_url"
              type="url"
              size="lg"
              value={discordUrl}
              onChange={(e) => setDiscordUrl(e.target.value)}
              placeholder="https://discord.gg/your-invite-code"
            />
          </InputGroup>
        </div>
      </div>

      <div>
        <Button
          variant="primary"
          size="md"
          stretch="auto"
          onClick={() => {
            void handleSubmit(onSubmit)();
          }}
          loading={isSubmitting}
          label={isSubmitting ? "Saving" : "Save changes"}
        />
      </div>
    </div>
  );
});
