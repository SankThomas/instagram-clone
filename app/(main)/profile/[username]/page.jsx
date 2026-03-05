"use client";

import { useParams } from "next/navigation";
import ProfilePage from "@/components/profile/ProfilePage";

export default function Profile() {
  const { username } = useParams();

  return <ProfilePage username={username} />;
}
