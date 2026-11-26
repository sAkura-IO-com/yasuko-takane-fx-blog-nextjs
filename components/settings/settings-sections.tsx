"use client";

import { Card, CardContent } from "@/components/ui/card";

import { ConfigRow, type ConfigRowState } from "./config-row";

export type SettingsSection = { title: string; fields: ConfigRowState[] };

export function SettingsSections({
  sections,
}: {
  sections: SettingsSection[];
}) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h4 className="text-xs font-medium text-muted-foreground">
            {section.title}
          </h4>
          <Card className="gap-0 py-0">
            <CardContent className="divide-y p-0">
              {section.fields.map((field) => (
                <ConfigRow
                  key={`${field.item.key}:${field.source}:${field.storedValue}:${field.effectivePreview}`}
                  state={field}
                />
              ))}
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  );
}
