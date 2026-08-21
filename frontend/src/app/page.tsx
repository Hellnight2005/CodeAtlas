"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/projects");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full text-slate-400 font-mono text-sm">
      Loading CodeAtlas Control Center...
    </div>
  );
}
