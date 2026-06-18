import { ForumSubNav } from "@/components/forum/ForumSubNav";

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ForumSubNav />
      {children}
    </>
  );
}
