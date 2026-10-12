import RiderGuard from "@/components/express/rider/RiderGuard";
import RiderEarnings from "@/components/express/rider/RiderEarnings";
export default function Page() {
  return (
    <RiderGuard>
      <RiderEarnings />
    </RiderGuard>
  );
}
