import { redirect } from "next/navigation";

export default function AdminNotesPage() {
  redirect("/admin/writing?tab=notes");
}
