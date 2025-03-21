"use client";
import TestSoknad from "~/components/TestSoknad";

export default function SoknadTestPage({ params }: { params: { applicationID: string } }) {
    const applicationID = params.applicationID === "new" ? undefined : parseInt(params.applicationID, 10);
    return <TestSoknad applicationID={applicationID} />;
}