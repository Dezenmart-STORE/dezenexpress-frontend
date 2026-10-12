import Image from "next/image";

export default function Logo() {
  return (
    // <div className="flex items-center gap-2 mb-6">
    <div className="w-full flex justify-center mb-6">
      <Image
        src="/dezen-express-logo.png"
        alt="Dezen-Express"
        width={52}
        height={52}
        priority
      />
    </div>
  );
}
