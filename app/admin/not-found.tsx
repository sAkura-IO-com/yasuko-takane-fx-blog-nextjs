import { redirect } from "next/navigation";

export default async function AdminNotFound() {
  redirect("/admin");
}
