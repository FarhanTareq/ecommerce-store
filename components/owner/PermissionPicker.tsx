"use client";

import { Check, ShieldCheck } from "lucide-react";
import {
  assignablePermissionModules,
  permissionPresets,
  type PermissionAction,
} from "@/lib/permissions";

const actionLabels: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
};

export default function PermissionPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(permission: string) {
    onChange(
      value.includes(permission)
        ? value.filter((item) => item !== permission)
        : [...value, permission],
    );
  }

  function applyPreset(permissions: string[]) {
    onChange([...new Set(permissions)]);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {permissionPresets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => applyPreset(preset.permissions)}
            className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-bold text-ink/60 transition hover:border-ink hover:text-ink"
          >
            <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange([])}
          className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-bold text-ink/50 transition hover:border-coral hover:text-coral"
        >
          Clear all
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {assignablePermissionModules.map((module) => {
          const selectedCount = module.actions.filter((action) =>
            value.includes(`${module.key}.${action}`),
          ).length;
          return (
            <fieldset
              key={module.key}
              className="rounded-xl border border-ink/10 bg-paper/60 p-3"
            >
              <legend className="flex items-center gap-2 px-1 text-xs font-bold">
                {module.label}
                {selectedCount > 0 ? (
                  <span className="rounded-full bg-ink px-1.5 py-0.5 text-[9px] text-white">
                    {selectedCount}
                  </span>
                ) : null}
              </legend>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {module.actions.map((action) => {
                  const permission = `${module.key}.${action}`;
                  const checked = value.includes(permission);
                  return (
                    <label
                      key={permission}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${
                        checked
                          ? "border-ink bg-ink text-white"
                          : "border-ink/10 bg-white text-ink/55 hover:border-ink/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(permission)}
                        className="sr-only"
                      />
                      {checked ? <Check className="h-3 w-3" /> : null}
                      {actionLabels[action]}
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] leading-4 text-ink/40">
                {module.description}
              </p>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}
