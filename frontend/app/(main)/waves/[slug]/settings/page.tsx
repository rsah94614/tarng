import { redirect } from "next/navigation";

export default function SettingsRedirect({ params }: { params: { slug: string } }) {
  redirect(`/waves/${params.slug}/settings/general`);
}
