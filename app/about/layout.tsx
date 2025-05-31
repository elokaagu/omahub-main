import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About OmaHub",
  description:
    "Learn about OmaHub's mission to connect Africa's innovative fashion talent with a global audience.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
