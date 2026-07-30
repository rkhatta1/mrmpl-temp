import type { Metadata } from "next";

import { EnquiriesInbox } from "@/components/admin/enquiries-inbox";

export const metadata: Metadata = {
  title: "Enquiries",
};

export default function AdminEnquiriesPage() {
  return <EnquiriesInbox />;
}
