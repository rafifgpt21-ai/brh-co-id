import { redirect } from "next/navigation";

export default function ExploreRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  redirect("/en/explore");
}
