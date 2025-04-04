import * as React from "react";
import Summary from "./dashboard/Summary";
import RecentSubmission from "./dashboard/RecentSubmission";
import CompletedReviews  from "./dashboard/CompletedReviews";

export default function Dashboard() {
  return (
    <>
    <Summary />
    <RecentSubmission/>
    <CompletedReviews/>
    </>
  );
}
