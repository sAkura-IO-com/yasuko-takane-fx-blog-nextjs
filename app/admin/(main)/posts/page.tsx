import { redirect } from "next/navigation";

export default function AdminPostsPage() {
  redirect("/admin/writing?tab=posts");
}
