import { redirect } from "next/navigation";

export default function AdminMediaPage() {
  redirect("/admin/storage?tab=images");
}
