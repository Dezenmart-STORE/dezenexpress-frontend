import RiderGuard from "@/components/express/rider/RiderGuard";
import RiderProfile from "@/components/express/rider/RiderProfile";
export default function Page() {
  return (
    <RiderGuard>
      <RiderProfile />
    </RiderGuard>
  );
}
