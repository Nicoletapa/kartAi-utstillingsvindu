"use client";
import React from "react";

const TiltaksAid = () => {
  return (
    <div className="h-[500px] w-full overflow-hidden rounded-lg border border-gray-200 shadow-lg">
      <iframe
        src={process.env.NEXT_PUBLIC_TILTAKSAID_URL}
        className="h-full w-full"
        title="TiltaksAid Map"
        allow="geolocation"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
};

export default TiltaksAid;
