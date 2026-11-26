import { redirect } from "next/navigation";

export default async function AdminCatchAll() {
  redirect("/admin");
}
