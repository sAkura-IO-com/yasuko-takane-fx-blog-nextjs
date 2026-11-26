import "server-only";

import { getSiteState } from "./state";

export class SiteReadOnlyError extends Error {
  constructor() {
    super("站点正在从备份恢复，暂时不能修改");
    this.name = "SiteReadOnlyError";
  }
}

export async function assertSiteWritable(): Promise<void> {
  const state = await getSiteState();
  if (state.persisted && state.maintenance) throw new SiteReadOnlyError();
}
